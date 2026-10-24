import { PayrollRun } from './payroll.model.js';
import { Employee } from '../employees/employee.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leave/leave.model.js';
import { Settings } from '../org/settings.model.js';
import { Holiday } from '../org/org.models.js';
import { AppError } from '../../shared/errors.js';
import { calculateWorkingDays } from '../../shared/workingDays.js';
import { calculatePayslip } from './payroll.calc.js';
import { roundMoney } from '../../shared/money.js';
import { logAudit } from '../audit/audit.service.js';
import { notifyPayrollFinalized } from '../comms/comms.service.js';

/**
 * Get total working days in a month (YYYY-MM) excluding weekends & company holidays.
 */
async function getMonthWorkingDays(monthStr) {
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);

  // First and last day of month
  const startDateStr = `${monthStr}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDateStr = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const settings = await Settings.findOne();
  const weekendDays = settings?.weekendDays ?? [0, 6];

  const holidays = await Holiday.find({
    date: { $gte: startDateStr, $lte: endDateStr }
  });
  const holidayDates = holidays.map((h) => h.date);

  const totalWorkingDays = calculateWorkingDays(startDateStr, endDateStr, weekendDays, holidayDates);
  return { startDateStr, endDateStr, totalWorkingDays, weekendDays, holidayDates };
}

/**
 * Calculate deduction metrics for an employee in a given month.
 */
async function calculateEmployeeMonthDeductions({
  employee,
  monthStr,
  startDateStr,
  endDateStr,
  weekendDays,
  holidayDates
}) {
  const empId = employee._id;

  // 1. Working days outside employment window (Proration for joiners/leavers)
  let outsideEmploymentDays = 0;
  const joinDate = employee.joiningDate ? employee.joiningDate.slice(0, 10) : null;
  const exitDate = employee.exitDate ? employee.exitDate.slice(0, 10) : null;

  if (joinDate && joinDate > startDateStr) {
    // Employee joined after month start: count working days prior to joinDate
    const priorEnd = new Date(joinDate + 'T00:00:00Z');
    priorEnd.setUTCDate(priorEnd.getUTCDate() - 1);
    const priorEndStr = priorEnd.toISOString().slice(0, 10);
    if (priorEndStr >= startDateStr) {
      outsideEmploymentDays += calculateWorkingDays(startDateStr, priorEndStr, weekendDays, holidayDates);
    }
  }

  if (exitDate && exitDate < endDateStr) {
    // Employee exited before month end: count working days after exitDate
    const postStart = new Date(exitDate + 'T00:00:00Z');
    postStart.setUTCDate(postStart.getUTCDate() + 1);
    const postStartStr = postStart.toISOString().slice(0, 10);
    if (postStartStr <= endDateStr) {
      outsideEmploymentDays += calculateWorkingDays(postStartStr, endDateStr, weekendDays, holidayDates);
    }
  }

  // 2. Unpaid leave days in month
  const unpaidLeaves = await LeaveRequest.find({
    employeeId: empId,
    leaveType: 'unpaid',
    status: 'approved',
    startDate: { $lte: endDateStr },
    endDate: { $gte: startDateStr }
  });

  let unpaidLeaveDays = 0;
  for (const ul of unpaidLeaves) {
    // Intersect leave range with the month range
    const effectiveStart = ul.startDate < startDateStr ? startDateStr : ul.startDate;
    const effectiveEnd = ul.endDate > endDateStr ? endDateStr : ul.endDate;
    unpaidLeaveDays += calculateWorkingDays(effectiveStart, effectiveEnd, weekendDays, holidayDates);
  }

  // 3. Attendance records in month
  const monthRegex = new RegExp(`^${monthStr}`);
  const attendanceRecords = await Attendance.find({
    employeeId: empId,
    date: { $regex: monthRegex }
  });

  let halfDays = 0;
  let lateDays = 0;
  attendanceRecords.forEach((att) => {
    if (att.status === 'half_day') {
      halfDays++;
    }
    if (att.isLate) {
      lateDays++;
    }
  });

  // Approved paid leaves in month
  const paidLeaves = await LeaveRequest.find({
    employeeId: empId,
    leaveType: { $ne: 'unpaid' },
    status: 'approved',
    startDate: { $lte: endDateStr },
    endDate: { $gte: startDateStr }
  });

  let paidLeaveDays = 0;
  for (const pl of paidLeaves) {
    const effectiveStart = pl.startDate < startDateStr ? startDateStr : pl.startDate;
    const effectiveEnd = pl.endDate > endDateStr ? endDateStr : pl.endDate;
    paidLeaveDays += calculateWorkingDays(effectiveStart, effectiveEnd, weekendDays, holidayDates);
  }

  // Count attended working days
  const attendedWorkingDays = attendanceRecords.filter((att) => att.isWorkingDay).length;

  // Expected working days within the employee's active tenure in this month
  const totalMonthWorkingDays = calculateWorkingDays(startDateStr, endDateStr, weekendDays, holidayDates);
  const activeTenureWorkingDays = Math.max(0, totalMonthWorkingDays - outsideEmploymentDays);

  // Absent days = active working days - attended days - paid leave days - unpaid leave days
  const accountedDays = attendedWorkingDays + paidLeaveDays + unpaidLeaveDays;
  const absentDays = Math.max(0, activeTenureWorkingDays - accountedDays);

  return {
    absentDays,
    unpaidLeaveDays,
    halfDays,
    outsideEmploymentDays,
    lateDays
  };
}

/**
 * Build payroll line items for all active/probation employees in a month.
 */
async function buildPayrollItems(monthStr) {
  const { startDateStr, endDateStr, totalWorkingDays, weekendDays, holidayDates } =
    await getMonthWorkingDays(monthStr);

  const employees = await Employee.find({
    status: { $in: ['active', 'probation'] }
  })
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .sort({ code: 1 });

  const items = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalTax = 0;
  let totalNet = 0;

  const settings = await Settings.findOne() || {};
  const isLatePenalty = Boolean(settings.latePenaltyEnabled);

  for (const emp of employees) {
    const deductions = await calculateEmployeeMonthDeductions({
      employee: emp,
      monthStr,
      startDateStr,
      endDateStr,
      weekendDays,
      holidayDates
    });

    const lateDays = deductions.lateDays || 0;
    const latePenaltyDays = isLatePenalty ? Math.floor(lateDays / 3) * 0.5 : 0;

    const payslip = calculatePayslip({
      basicSalary: emp.salary?.basic || 0,
      workingDaysInMonth: totalWorkingDays,
      absentDays: deductions.absentDays,
      unpaidLeaveDays: deductions.unpaidLeaveDays,
      halfDays: deductions.halfDays,
      outsideEmploymentDays: deductions.outsideEmploymentDays,
      lateDays,
      latePenaltyDays
    });

    totalGross += payslip.gross;
    totalDeductions += payslip.deductionAmount;
    totalTax += payslip.monthlyTax;
    totalNet += payslip.netSalary;

    items.push({
      employeeId: emp._id,
      employeeCode: emp.code,
      employeeName: emp.name,
      departmentName: emp.departmentId?.name || '-',
      designationTitle: emp.designationId?.title || '-',
      basicSalary: payslip.basic,
      hra: payslip.hra,
      medical: payslip.medical,
      grossSalary: payslip.gross,
      workingDaysInMonth: payslip.workingDaysInMonth,
      perDayRate: payslip.perDayRate,
      absentDays: payslip.absentDays,
      unpaidLeaveDays: payslip.unpaidLeaveDays,
      halfDays: payslip.halfDays,
      outsideEmploymentDays: payslip.outsideEmploymentDays,
      lateDays: payslip.lateDays,
      latePenaltyDays: payslip.latePenaltyDays,
      deductionDays: payslip.deductionDays,
      deductionAmount: payslip.deductionAmount,
      annualTax: payslip.annualTax,
      monthlyTax: payslip.monthlyTax,
      netSalary: payslip.netSalary
    });
  }

  return {
    items,
    totals: {
      totalEmployees: items.length,
      totalGross: roundMoney(totalGross),
      totalDeductions: roundMoney(totalDeductions),
      totalTax: roundMoney(totalTax),
      totalNet: roundMoney(totalNet)
    }
  };
}

/**
 * Generate a new Draft Payroll Run for a month.
 */
export async function createPayrollRun(monthStr, ctx) {
  // Check if run already exists for this month
  const existing = await PayrollRun.findOne({ month: monthStr });
  if (existing) {
    throw new AppError(
      'RUN_ALREADY_EXISTS',
      409,
      `A payroll run already exists for ${monthStr}. Use regenerate if it is still a draft.`
    );
  }

  const { items, totals } = await buildPayrollItems(monthStr);

  const run = await PayrollRun.create({
    month: monthStr,
    status: 'draft',
    createdBy: ctx.userId,
    ...totals,
    items
  });

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'payroll_run',
    entityId: run._id,
    after: { month: monthStr, status: 'draft', totalEmployees: totals.totalEmployees, totalNet: totals.totalNet }
  });

  return run;
}

/**
 * Regenerate an existing draft payroll run.
 */
export async function regeneratePayrollRun(id, ctx) {
  const run = await PayrollRun.findById(id);
  if (!run) {
    throw new AppError('NOT_FOUND', 404, 'Payroll run not found.');
  }

  // Locked check
  if (run.status === 'finalized') {
    throw new AppError(
      'FINALIZED_RUN_LOCKED',
      409,
      'Finalized payroll runs are locked and cannot be regenerated or modified.'
    );
  }

  const { items, totals } = await buildPayrollItems(run.month);

  run.items = items;
  run.totalEmployees = totals.totalEmployees;
  run.totalGross = totals.totalGross;
  run.totalDeductions = totals.totalDeductions;
  run.totalTax = totals.totalTax;
  run.totalNet = totals.totalNet;
  await run.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'update',
    entity: 'payroll_run',
    entityId: run._id,
    after: { month: run.month, action: 'regenerate', totalNet: totals.totalNet }
  });

  return run;
}

/**
 * Finalize payroll run (Admin only).
 */
export async function finalizePayrollRun(id, ctx) {
  const run = await PayrollRun.findById(id);
  if (!run) {
    throw new AppError('NOT_FOUND', 404, 'Payroll run not found.');
  }

  if (run.status === 'finalized') {
    throw new AppError('ALREADY_FINALIZED', 409, 'Payroll run is already finalized.');
  }

  run.status = 'finalized';
  run.finalizedBy = ctx.userId;
  run.finalizedAt = new Date();
  await run.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'finalize',
    entity: 'payroll_run',
    entityId: run._id,
    after: { month: run.month, status: 'finalized', finalizedAt: run.finalizedAt }
  });

  // Notify employees
  await notifyPayrollFinalized(run);

  return run;
}

/**
 * List payroll runs.
 */
export async function listPayrollRuns(query = {}) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    PayrollRun.find()
      .select('-items') // Exclude heavy items in list view
      .populate('createdBy', 'email role')
      .populate('finalizedBy', 'email role')
      .sort({ month: -1 })
      .skip(skip)
      .limit(limit),
    PayrollRun.countDocuments()
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
 * Get payroll run details with line items.
 */
export async function getPayrollRunById(id) {
  const run = await PayrollRun.findById(id)
    .populate('createdBy', 'email role')
    .populate('finalizedBy', 'email role');

  if (!run) {
    throw new AppError('NOT_FOUND', 404, 'Payroll run not found.');
  }

  return run;
}

/**
 * Get employee payslips.
 * For role = employee: only their own items from finalized runs.
 * For HR/Admin: all finalized items or by employeeId.
 */
export async function getEmployeePayslips(employeeId, ctx) {
  let targetEmpId = employeeId;
  if (ctx.role === 'employee') {
    targetEmpId = ctx.employeeId;
  }

  if (!targetEmpId) {
    throw new AppError('EMPLOYEE_REQUIRED', 400, 'Employee ID is required.');
  }

  // Fetch all finalized runs that contain this employee's payslip
  const runs = await PayrollRun.find(
    { status: 'finalized', 'items.employeeId': targetEmpId },
    { month: 1, finalizedAt: 1, 'items.$': 1 }
  ).sort({ month: -1 });

  const payslips = runs.map((run) => {
    const item = run.items[0];
    return {
      runId: run._id,
      month: run.month,
      finalizedAt: run.finalizedAt,
      payslip: item
    };
  });

  return payslips;
}

/**
 * Get single payslip for PDF generation or viewing with ownership check.
 */
export async function getSinglePayslip(runId, employeeId, ctx) {
  const run = await PayrollRun.findById(runId);
  if (!run) {
    throw new AppError('NOT_FOUND', 404, 'Payroll run not found.');
  }

  // Employee can only access their own payslip from a finalized run
  let targetEmpId = employeeId;
  if (ctx.role === 'employee') {
    targetEmpId = ctx.employeeId;
    if (run.status !== 'finalized') {
      throw new AppError('NOT_FOUND', 404, 'Payslip not found.');
    }
  }

  const item = run.items.find((i) => String(i.employeeId) === String(targetEmpId));
  if (!item) {
    throw new AppError('NOT_FOUND', 404, 'Payslip not found for this employee.');
  }

  return {
    runId: run._id,
    month: run.month,
    status: run.status,
    finalizedAt: run.finalizedAt,
    payslip: item
  };
}
