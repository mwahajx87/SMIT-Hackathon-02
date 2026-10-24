import { Attendance } from './attendance.model.js';
import { AttendanceCorrection } from './correction.model.js';
import { Employee } from '../employees/employee.model.js';
import { Settings } from '../org/settings.model.js';
import { Holiday } from '../org/org.models.js';
import { AppError } from '../../shared/errors.js';
import { getCompanyDateString } from '../../shared/dates.js';
import { isCheckInLate, calculateAttendanceStatus } from './status.js';
import { logAudit } from '../audit/audit.service.js';
import { createNotification } from '../comms/comms.service.js';
import { getHaversineDistance, isWithinRadius } from '../../shared/haversine.js';

export async function checkIn(payload = 'web', ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const options = typeof payload === 'string' ? { source: payload } : (payload || {});
  const source = options.source || 'web';

  const settings = (await Settings.findOne()) || {
    timezone: 'Asia/Karachi',
    officeStart: '09:00',
    graceMinutes: 15,
    halfDayHours: 5,
    weekendDays: [0, 6]
  };

  // T10.1: Camera attendance checks
  if (source === 'camera') {
    if (!options.faceVerified) {
      throw new AppError('FACE_VERIFICATION_FAILED', 422, 'Face detection required. Exactly one face must be verified.');
    }

    if (options.accuracy != null && options.accuracy > 100) {
      throw new AppError(
        'GEOLOCATION_INACCURATE',
        422,
        `GPS accuracy (${Math.round(options.accuracy)}m) is too low. Must be within 100m. Please submit an attendance correction request if outside office.`
      );
    }

    if (settings.officeLat != null && settings.officeLng != null) {
      if (options.latitude == null || options.longitude == null) {
        throw new AppError('LOCATION_REQUIRED', 422, 'Geolocation coordinates are required for camera check-in.');
      }

      const distance = getHaversineDistance(
        options.latitude,
        options.longitude,
        settings.officeLat,
        settings.officeLng
      );

      const maxRadius = settings.officeRadiusM || 150;
      if (distance > maxRadius) {
        throw new AppError(
          'OUTSIDE_OFFICE_RADIUS',
          422,
          `You are ${Math.round(distance)}m away from office (allowed radius: ${maxRadius}m). Please check in from the office or use the correction request flow.`
        );
      }
    }
  }

  const now = new Date();
  const dateStr = getCompanyDateString(now, settings.timezone);

  // Check for duplicate check-in today
  const existing = await Attendance.findOne({ employeeId: ctx.employeeId, date: dateStr });
  if (existing) {
    throw new AppError('ALREADY_CHECKED_IN', 409, 'You have already checked in for today.');
  }

  // Determine if today is a working day
  const dayOfWeek = now.getUTCDay();
  const isWeekend = (settings.weekendDays || [0, 6]).includes(dayOfWeek);
  const isHoliday = Boolean(await Holiday.findOne({ date: dateStr }));
  const isWorkingDay = !isWeekend && !isHoliday;

  const late = isCheckInLate(now, settings.officeStart, settings.graceMinutes, settings.timezone);

  const record = await Attendance.create({
    employeeId: ctx.employeeId,
    date: dateStr,
    checkInAt: now,
    status: late ? 'late' : 'present',
    source,
    isWorkingDay,
    ruleSnapshot: {
      officeStart: settings.officeStart,
      graceMinutes: settings.graceMinutes,
      halfDayHours: settings.halfDayHours
    }
  });

  return record;
}

export async function checkOut(ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const settings = (await Settings.findOne()) || {
    timezone: 'Asia/Karachi',
    halfDayHours: 5
  };

  const now = new Date();
  const dateStr = getCompanyDateString(now, settings.timezone);

  const record = await Attendance.findOne({ employeeId: ctx.employeeId, date: dateStr });
  if (!record) {
    throw new AppError('NOT_CHECKED_IN', 400, 'No check-in record found for today.');
  }

  if (record.checkOutAt) {
    throw new AppError('ALREADY_CHECKED_OUT', 409, 'You have already checked out for today.');
  }

  record.checkOutAt = now;
  const { status, workedMinutes } = calculateAttendanceStatus({
    checkInAt: record.checkInAt,
    checkOutAt: now,
    officeStart: record.ruleSnapshot.officeStart,
    graceMinutes: record.ruleSnapshot.graceMinutes,
    halfDayHours: record.ruleSnapshot.halfDayHours,
    timezone: settings.timezone
  });

  record.status = status;
  record.workedMinutes = workedMinutes;
  await record.save();

  return record;
}

export async function getTodayStatus(ctx) {
  if (!ctx.employeeId) return null;

  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const now = new Date();
  const dateStr = getCompanyDateString(now, settings.timezone);

  return Attendance.findOne({ employeeId: ctx.employeeId, date: dateStr });
}

export async function getCalendar(monthStr, employeeId, ctx) {
  // Scope check: If employee role, force employeeId to self
  let targetEmpId = employeeId;
  if (ctx.role === 'employee') {
    targetEmpId = ctx.employeeId;
  } else if (!targetEmpId) {
    targetEmpId = ctx.employeeId;
  }

  const monthRegex = new RegExp(`^${monthStr}`);
  const records = await Attendance.find({
    employeeId: targetEmpId,
    date: { $regex: monthRegex }
  }).sort({ date: 1 });

  return records;
}

export async function getAttendanceBoard(dateStr, ctx) {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const targetDate = dateStr || getCompanyDateString(new Date(), settings.timezone);

  // Fetch all active employees
  const employees = await Employee.find({ status: { $in: ['active', 'probation'] } })
    .populate('departmentId', 'name code')
    .populate('designationId', 'title')
    .sort({ name: 1 });

  // Fetch attendance records for targetDate
  const records = await Attendance.find({ date: targetDate });
  const attendanceMap = new Map();
  records.forEach((r) => attendanceMap.set(String(r.employeeId), r));

  const rows = employees.map((emp) => {
    const att = attendanceMap.get(String(emp._id));
    return {
      employee: {
        id: emp._id,
        code: emp.code,
        name: emp.name,
        department: emp.departmentId?.name || '-',
        designation: emp.designationId?.title || '-'
      },
      date: targetDate,
      checkInAt: att?.checkInAt || null,
      checkOutAt: att?.checkOutAt || null,
      status: att?.status || 'not_checked_in',
      workedMinutes: att?.workedMinutes || 0,
      isWorkingDay: att?.isWorkingDay ?? true
    };
  });

  // Calculate summary counts
  const summary = {
    total: employees.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    halfDay: rows.filter((r) => r.status === 'half_day').length,
    notCheckedIn: rows.filter((r) => r.status === 'not_checked_in').length
  };

  return { date: targetDate, summary, items: rows };
}

// Attendance Corrections
export async function requestCorrection(data, ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const correction = await AttendanceCorrection.create({
    employeeId: ctx.employeeId,
    date: data.date,
    requestedCheckIn: data.requestedCheckIn,
    requestedCheckOut: data.requestedCheckOut,
    reason: data.reason,
    status: 'pending'
  });

  return correction;
}

export async function listCorrections(query = {}, ctx) {
  const filter = {};

  // Employee sees only own requests
  if (ctx.role === 'employee') {
    filter.employeeId = ctx.employeeId;
  } else if (query.status) {
    filter.status = query.status;
  }

  return AttendanceCorrection.find(filter)
    .populate('employeeId', 'code name email departmentId designationId')
    .sort({ createdAt: -1 });
}

export async function decideCorrection(id, { status, decisionComment }, ctx) {
  const correction = await AttendanceCorrection.findById(id).populate('employeeId');
  if (!correction) {
    throw new AppError('NOT_FOUND', 404, 'Correction request not found.');
  }

  if (correction.status !== 'pending') {
    throw new AppError('ALREADY_DECIDED', 400, 'This correction request has already been decided.');
  }

  // No self-approval: HR cannot approve their own requests
  if (ctx.role === 'hr' && String(correction.employeeId._id) === String(ctx.employeeId)) {
    throw new AppError('FORBIDDEN', 403, 'You cannot approve your own attendance correction. An Admin must decide.');
  }

  correction.status = status;
  correction.decidedBy = ctx.userId;
  correction.decisionComment = decisionComment;
  await correction.save();

  // If approved, update or create attendance record with source='correction'
  if (status === 'approved') {
    let attendance = await Attendance.findOne({
      employeeId: correction.employeeId._id,
      date: correction.date
    });

    if (!attendance) {
      attendance = new Attendance({
        employeeId: correction.employeeId._id,
        date: correction.date,
        source: 'correction',
        isWorkingDay: true
      });
    }

    if (correction.requestedCheckIn) {
      attendance.checkInAt = new Date(`${correction.date}T${correction.requestedCheckIn}:00Z`);
    }
    if (correction.requestedCheckOut) {
      attendance.checkOutAt = new Date(`${correction.date}T${correction.requestedCheckOut}:00Z`);
    }
    attendance.status = 'present';
    attendance.source = 'correction';
    attendance.correctionId = correction._id;
    await attendance.save();
  }

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: status,
    entity: 'attendance_correction',
    entityId: correction._id,
    after: { status, decisionComment }
  });

  // Notify applicant
  const user = await User.findOne({ employeeId: correction.employeeId._id });
  if (user) {
    await createNotification({
      userId: user._id,
      type: 'correction_decision',
      title: `Attendance Correction ${status.toUpperCase()}`,
      body: `Your attendance correction for ${correction.date} was ${status}. Comment: "${decisionComment}"`,
      link: '/attendance'
    });
  }

  return correction;
}
