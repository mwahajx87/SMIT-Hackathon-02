import { Employee } from '../employees/employee.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leave/leave.model.js';
import { LeaveType, Department, Designation, Holiday } from '../org/org.models.js';
import { PayrollRun } from '../payroll/payroll.model.js';
import { Settings } from '../org/settings.model.js';
import { calculateWorkingDays } from '../../shared/workingDays.js';
import { roundMoney } from '../../shared/money.js';
import { getCompanyDateString } from '../../shared/dates.js';

/**
 * Helper to get default date range if none provided (e.g. current month).
 */
export async function resolveDateRange(from, to) {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const now = new Date();
  const todayStr = getCompanyDateString(now, settings.timezone);

  const start = from || `${todayStr.slice(0, 7)}-01`;
  const end = to || todayStr;
  return { fromDate: start, toDate: end, timezone: settings.timezone };
}

/**
 * 1. Headcount: Active + probation on the end date (optionally filtered by department).
 */
export async function getHeadcountMetric(asOfDate, departmentId) {
  const filter = {
    status: { $in: ['active', 'probation'] }
  };
  if (departmentId) filter.departmentId = departmentId;
  if (asOfDate) {
    filter.joiningDate = { $lte: asOfDate };
  }

  const count = await Employee.countDocuments(filter);
  return count;
}

/**
 * 2. Attrition: Exits in period ÷ average headcount × 100.
 */
export async function getAttritionMetric(fromDate, toDate, departmentId) {
  const startHeadcountFilter = {
    status: { $in: ['active', 'probation', 'exited'] },
    joiningDate: { $lte: fromDate },
    $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: { $gte: fromDate } }]
  };
  if (departmentId) startHeadcountFilter.departmentId = departmentId;
  const startHeadcount = await Employee.countDocuments(startHeadcountFilter);

  const endHeadcount = await getHeadcountMetric(toDate, departmentId);
  const avgHeadcount = (startHeadcount + endHeadcount) / 2 || 1;

  const exitFilter = {
    status: 'exited',
    exitDate: { $gte: fromDate, $lte: toDate }
  };
  if (departmentId) exitFilter.departmentId = departmentId;
  const exitCount = await Employee.countDocuments(exitFilter);

  const rate = roundMoney((exitCount / avgHeadcount) * 100);
  return { exitCount, avgHeadcount: roundMoney(avgHeadcount), rate };
}

/**
 * 3. Attendance Rate & Late %:
 * Attendance rate = (present + late + missing_checkout + 0.5 * half_day) / (working-day records - on_leave)
 * Late % = late / (present + late)
 */
export async function getAttendanceRateMetrics(fromDate, toDate, departmentId, employeeId = null) {
  const match = {
    date: { $gte: fromDate, $lte: toDate },
    isWorkingDay: true
  };

  if (employeeId) {
    match.employeeId = employeeId;
  } else if (departmentId) {
    const emps = await Employee.find({ departmentId }).select('_id');
    match.employeeId = { $in: emps.map((e) => e._id) };
  }

  const records = await Attendance.find(match);

  let present = 0;
  let late = 0;
  let halfDay = 0;
  let missingCheckout = 0;

  records.forEach((r) => {
    if (r.status === 'present') present++;
    else if (r.status === 'late') late++;
    else if (r.status === 'half_day') halfDay++;
    else if (r.status === 'missing_checkout') missingCheckout++;
  });

  const totalWorkingRecords = records.length;
  const totalAttendedUnits = present + late + missingCheckout + 0.5 * halfDay;
  const attendanceRate = totalWorkingRecords > 0 ? roundMoney((totalAttendedUnits / totalWorkingRecords) * 100) : 100;

  const totalOnTimeOrLate = present + late;
  const latePercentage = totalOnTimeOrLate > 0 ? roundMoney((late / totalOnTimeOrLate) * 100) : 0;

  return {
    totalRecords: totalWorkingRecords,
    present,
    late,
    halfDay,
    missingCheckout,
    attendanceRate,
    latePercentage
  };
}

/**
 * 4. Top Late-Comers
 */
export async function getTopLateComers(fromDate, toDate, limit = 5) {
  const records = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: fromDate, $lte: toDate },
        status: 'late'
      }
    },
    {
      $group: {
        _id: '$employeeId',
        lateCount: { $sum: 1 }
      }
    },
    { $sort: { lateCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'emp'
      }
    },
    { $unwind: '$emp' },
    {
      $project: {
        _id: 1,
        employeeCode: '$emp.code',
        employeeName: '$emp.name',
        lateCount: 1
      }
    }
  ]);

  return records;
}

/**
 * 5. Leave Utilization by Type:
 * Approved days / quota, per leave type
 */
export async function getLeaveUtilization(fromDate, toDate, departmentId, employeeId = null) {
  const match = {
    status: 'approved',
    startDate: { $gte: fromDate },
    endDate: { $lte: toDate }
  };

  if (employeeId) {
    match.employeeId = employeeId;
  } else if (departmentId) {
    const emps = await Employee.find({ departmentId }).select('_id');
    match.employeeId = { $in: emps.map((e) => e._id) };
  }

  const [types, leaveSums] = await Promise.all([
    LeaveType.find(),
    LeaveRequest.aggregate([
      { $match: match },
      { $group: { _id: '$leaveType', approvedDays: { $sum: '$workingDays' } } }
    ])
  ]);

  const map = new Map();
  leaveSums.forEach((s) => map.set(s._id, s.approvedDays));

  return types.map((t) => {
    const approvedDays = map.get(t.key) || 0;
    const utilizationRate = t.yearlyQuota ? roundMoney((approvedDays / t.yearlyQuota) * 100) : null;
    return {
      key: t.key,
      name: t.name,
      approvedDays,
      yearlyQuota: t.yearlyQuota,
      utilizationRate
    };
  });
}

/**
 * 6. Payroll Cost & Average Salary
 */
export async function getPayrollMetrics(monthStr, departmentId) {
  const run = await PayrollRun.findOne(
    monthStr ? { month: monthStr } : {},
    {},
    { sort: { month: -1 } }
  );

  if (!run || !run.items || run.items.length === 0) {
    return {
      month: monthStr || null,
      totalGross: 0,
      totalNet: 0,
      averageSalary: 0,
      byDepartment: []
    };
  }

  let filteredItems = run.items;
  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (dept) {
      filteredItems = run.items.filter((i) => i.departmentName === dept.name);
    }
  }

  const totalGross = filteredItems.reduce((acc, i) => acc + (i.grossSalary || 0), 0);
  const totalNet = filteredItems.reduce((acc, i) => acc + (i.netSalary || 0), 0);
  const averageSalary = filteredItems.length > 0 ? roundMoney(totalGross / filteredItems.length) : 0;

  // Breakdown by department
  const deptMap = new Map();
  filteredItems.forEach((i) => {
    const dept = i.departmentName || 'General';
    const curr = deptMap.get(dept) || { gross: 0, net: 0, count: 0 };
    curr.gross += i.grossSalary || 0;
    curr.net += i.netSalary || 0;
    curr.count += 1;
    deptMap.set(dept, curr);
  });

  const byDepartment = Array.from(deptMap.entries()).map(([dept, val]) => ({
    department: dept,
    gross: roundMoney(val.gross),
    net: roundMoney(val.net),
    count: val.count,
    averageSalary: roundMoney(val.gross / (val.count || 1))
  }));

  return {
    month: run.month,
    totalGross: roundMoney(totalGross),
    totalNet: roundMoney(totalNet),
    averageSalary,
    byDepartment
  };
}

/**
 * Admin Dashboard Aggregator
 */
export async function getAdminDashboard(query = {}) {
  const { fromDate, toDate } = await resolveDateRange(query.from, query.to);
  const departmentId = query.departmentId || null;

  const [headcount, attrition, attendance, topLateComers, leaveStats, payroll] = await Promise.all([
    getHeadcountMetric(toDate, departmentId),
    getAttritionMetric(fromDate, toDate, departmentId),
    getAttendanceRateMetrics(fromDate, toDate, departmentId),
    getTopLateComers(fromDate, toDate, 5),
    getLeaveUtilization(fromDate, toDate, departmentId),
    getPayrollMetrics(query.month, departmentId)
  ]);

  return {
    period: { from: fromDate, to: toDate },
    kpis: {
      headcount,
      attritionRate: attrition.rate,
      attendanceRate: attendance.attendanceRate,
      latePercentage: attendance.latePercentage,
      payrollCost: payroll.totalNet,
      averageSalary: payroll.averageSalary
    },
    attendanceSummary: attendance,
    topLateComers,
    leaveUtilization: leaveStats,
    payrollSummary: payroll
  };
}

/**
 * HR Dashboard Aggregator
 */
export async function getHrDashboard(query = {}) {
  const { fromDate, toDate } = await resolveDateRange(query.from, query.to);
  const departmentId = query.departmentId || null;

  const [headcount, attendance, topLateComers, leaveStats, departments] = await Promise.all([
    getHeadcountMetric(toDate, departmentId),
    getAttendanceRateMetrics(fromDate, toDate, departmentId),
    getTopLateComers(fromDate, toDate, 5),
    getLeaveUtilization(fromDate, toDate, departmentId),
    Department.find()
  ]);

  return {
    period: { from: fromDate, to: toDate },
    kpis: {
      headcount,
      attendanceRate: attendance.attendanceRate,
      latePercentage: attendance.latePercentage,
      presentToday: attendance.present + attendance.late
    },
    attendance,
    topLateComers,
    leaveUtilization: leaveStats,
    departments
  };
}

/**
 * Employee Dashboard Aggregator (Scoped strictly to logged-in employee)
 */
export async function getEmployeeDashboard(ctx) {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const todayStr = getCompanyDateString(new Date(), settings.timezone);
  const currentMonth = todayStr.slice(0, 7);

  const [todayAttendance, monthRecords, balances, lastPayrollRun] = await Promise.all([
    Attendance.findOne({ employeeId: ctx.employeeId, date: todayStr }),
    Attendance.find({
      employeeId: ctx.employeeId,
      date: { $regex: new RegExp(`^${currentMonth}`) }
    }),
    LeaveRequest.find({ employeeId: ctx.employeeId, status: 'approved' }),
    PayrollRun.findOne(
      { status: 'finalized', 'items.employeeId': ctx.employeeId },
      { month: 1, finalizedAt: 1, 'items.$': 1 },
      { sort: { month: -1 } }
    )
  ]);

  // Total worked hours in current month
  let totalMinutesWorked = 0;
  let lateCount = 0;
  monthRecords.forEach((r) => {
    totalMinutesWorked += r.workedMinutes || 0;
    if (r.status === 'late') lateCount++;
  });

  const hoursWorked = roundMoney(totalMinutesWorked / 60);

  return {
    today: todayStr,
    todayAttendance: todayAttendance
      ? {
          status: todayAttendance.status,
          checkInAt: todayAttendance.checkInAt,
          checkOutAt: todayAttendance.checkOutAt,
          workedMinutes: todayAttendance.workedMinutes
        }
      : null,
    monthStats: {
      month: currentMonth,
      hoursWorked,
      expectedWeeklyHours: 40,
      lateCount
    },
    lastPayslip: lastPayrollRun
      ? {
          month: lastPayrollRun.month,
          finalizedAt: lastPayrollRun.finalizedAt,
          netSalary: lastPayrollRun.items[0]?.netSalary || 0
        }
      : null
  };
}
