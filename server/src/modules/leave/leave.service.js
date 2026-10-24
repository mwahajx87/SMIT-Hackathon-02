import { LeaveRequest } from './leave.model.js';
import { LeaveType, Holiday } from '../org/org.models.js';
import { Settings } from '../org/settings.model.js';
import { AppError } from '../../shared/errors.js';
import { calculateWorkingDays } from '../../shared/workingDays.js';
import { logAudit } from '../audit/audit.service.js';
import { createNotification } from '../comms/comms.service.js';
import { User } from '../auth/user.model.js';

/**
 * Get holidays for a date range as an array of YYYY-MM-DD strings.
 */
async function getHolidaysInRange(startDate, endDate) {
  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  });
  return holidays.map((h) => h.date);
}

/**
 * Get the weekend days from settings.
 */
async function getWeekendDays() {
  const settings = await Settings.findOne();
  return settings?.weekendDays ?? [0, 6];
}

/**
 * Calculate leave balance for a given employee and leave type in the current year.
 * Returns: { quota, approved, pending, used, available }
 */
export async function getLeaveBalance(employeeId, leaveTypeKey, year) {
  const leaveType = await LeaveType.findOne({ key: leaveTypeKey });
  if (!leaveType) {
    throw new AppError('INVALID_LEAVE_TYPE', 400, `Leave type "${leaveTypeKey}" not found.`);
  }

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Sum approved working days
  const approvedResult = await LeaveRequest.aggregate([
    {
      $match: {
        employeeId,
        leaveType: leaveTypeKey,
        status: 'approved',
        startDate: { $gte: yearStart, $lte: yearEnd }
      }
    },
    { $group: { _id: null, total: { $sum: '$workingDays' } } }
  ]);
  const approved = approvedResult[0]?.total || 0;

  // Sum pending working days
  const pendingResult = await LeaveRequest.aggregate([
    {
      $match: {
        employeeId,
        leaveType: leaveTypeKey,
        status: 'pending',
        startDate: { $gte: yearStart, $lte: yearEnd }
      }
    },
    { $group: { _id: null, total: { $sum: '$workingDays' } } }
  ]);
  const pending = pendingResult[0]?.total || 0;

  const quota = leaveType.yearlyQuota; // null = unlimited (unpaid)
  const used = approved + pending; // committed days
  const available = quota === null ? null : Math.max(0, quota - used);

  return {
    leaveType: leaveTypeKey,
    name: leaveType.name,
    quota,
    approved,
    pending,
    used,
    available,
    isPaid: leaveType.isPaid
  };
}

/**
 * Get all leave balances for an employee in a given year.
 */
export async function getAllBalances(employeeId, year) {
  const types = await LeaveType.find();
  const balances = await Promise.all(
    types.map((lt) => getLeaveBalance(employeeId, lt.key, year))
  );
  return balances;
}

/**
 * Check for overlapping leave requests (pending or approved).
 * An overlap exists if any existing request's date range intersects with the new one.
 */
async function checkOverlap(employeeId, startDate, endDate, excludeId = null) {
  const filter = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    // Overlap condition: existingStart <= newEnd AND existingEnd >= newStart
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const overlapping = await LeaveRequest.findOne(filter);
  return overlapping;
}

/**
 * Apply for leave (POST /leave)
 */
export async function applyLeave(data, ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const { leaveType, startDate, endDate, reason } = data;

  // Validate startDate <= endDate
  if (startDate > endDate) {
    throw new AppError('INVALID_DATE_RANGE', 422, 'Start date must be on or before end date.');
  }

  // Calculate working days (skip weekends and holidays)
  const weekendDays = await getWeekendDays();
  const holidays = await getHolidaysInRange(startDate, endDate);
  const workingDays = calculateWorkingDays(startDate, endDate, weekendDays, holidays);

  if (workingDays < 1) {
    throw new AppError('NO_WORKING_DAYS', 422, 'Selected date range contains no working days.');
  }

  // Check overlap
  const overlap = await checkOverlap(ctx.employeeId, startDate, endDate);
  if (overlap) {
    throw new AppError(
      'LEAVE_OVERLAP',
      422,
      `Leave request overlaps with an existing ${overlap.status} request (${overlap.startDate} to ${overlap.endDate}).`
    );
  }

  // Check balance (skip for unpaid — unlimited)
  const year = startDate.slice(0, 4);
  const balance = await getLeaveBalance(ctx.employeeId, leaveType, year);

  if (balance.available !== null && workingDays > balance.available) {
    throw new AppError(
      'INSUFFICIENT_BALANCE',
      422,
      `Insufficient ${balance.name} balance. Available: ${balance.available}, Requested: ${workingDays}.`
    );
  }

  const request = await LeaveRequest.create({
    employeeId: ctx.employeeId,
    leaveType,
    startDate,
    endDate,
    workingDays,
    reason,
    status: 'pending'
  });

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'leave_request',
    entityId: request._id,
    after: { leaveType, startDate, endDate, workingDays, reason }
  });

  return request;
}

/**
 * Cancel a leave request. Only the owner can cancel, and only pending requests.
 */
export async function cancelLeave(id, ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const request = await LeaveRequest.findById(id);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Leave request not found.');
  }

  // Employee can only cancel own requests
  if (ctx.role === 'employee' && String(request.employeeId) !== String(ctx.employeeId)) {
    throw new AppError('NOT_FOUND', 404, 'Leave request not found.');
  }

  if (request.status !== 'pending') {
    throw new AppError(
      'CANNOT_CANCEL',
      400,
      `Cannot cancel a leave request with status "${request.status}".`
    );
  }

  request.status = 'cancelled';
  await request.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'cancel',
    entity: 'leave_request',
    entityId: request._id,
    after: { status: 'cancelled' }
  });

  return request;
}

/**
 * List leave requests with optional filters.
 * Employees see only their own; HR/Admin see all.
 */
export async function listLeaveRequests(query, ctx) {
  const filter = {};

  // Scope: employee sees only own
  if (ctx.role === 'employee') {
    filter.employeeId = ctx.employeeId;
  }

  if (query.leaveType) filter.leaveType = query.leaveType;
  if (query.status) filter.status = query.status;

  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('employeeId', 'code name email departmentId')
      .populate('decidedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Get pending leave requests for HR/Admin inbox.
 */
export async function getLeaveInbox(query, ctx) {
  const filter = { status: 'pending' };

  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate({
        path: 'employeeId',
        select: 'code name email departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter)
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 }
  };
}

/**
 * Decide (approve / reject) a leave request.
 * Requires comment. No self-approval (HR cannot approve own).
 */
export async function decideLeave(id, { status, decisionComment }, ctx) {
  const request = await LeaveRequest.findById(id).populate('employeeId');
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Leave request not found.');
  }

  if (request.status !== 'pending') {
    throw new AppError('ALREADY_DECIDED', 400, 'This leave request has already been decided.');
  }

  // No self-approval: HR cannot approve their own leave
  if (ctx.role === 'hr' && String(request.employeeId._id) === String(ctx.employeeId)) {
    throw new AppError(
      'FORBIDDEN',
      403,
      'You cannot approve your own leave request. An Admin must decide.'
    );
  }

  request.status = status;
  request.decidedBy = ctx.userId;
  request.decisionComment = decisionComment;
  request.decidedAt = new Date();
  await request.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: status,
    entity: 'leave_request',
    entityId: request._id,
    after: { status, decisionComment }
  });

  // Notify applicant
  const user = await User.findOne({ employeeId: request.employeeId._id });
  if (user) {
    await createNotification({
      userId: user._id,
      type: 'leave_decision',
      title: `Leave Request ${status.toUpperCase()}`,
      body: `Your leave request for ${request.startDate} to ${request.endDate} was ${status}. Comment: "${decisionComment}"`,
      link: '/leave'
    });
  }

  return request;
}
