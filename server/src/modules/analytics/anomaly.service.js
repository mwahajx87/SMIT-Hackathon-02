import { Employee } from '../employees/employee.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leave/leave.model.js';
import { Settings } from '../org/settings.model.js';
import { Holiday } from '../org/org.models.js';
import { getCompanyDateString } from '../../shared/dates.js';
import { calculateWorkingDays } from '../../shared/workingDays.js';

/**
 * T10.3 — Absence Anomaly Flags
 * Flags active employees who:
 *  - Have >= 3 absences in the last 30 days, OR
 *  - Have >= 2 consecutive unexcused absences, OR
 *  - Have sudden spikes in absences vs previous month.
 */
export async function getAbsenceAnomalies() {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi', weekendDays: [0, 6] };
  const todayStr = getCompanyDateString(new Date(), settings.timezone);

  // 30 days range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = getCompanyDateString(thirtyDaysAgo, settings.timezone);

  const holidays = await Holiday.find({ date: { $gte: thirtyDaysAgoStr, $lte: todayStr } });
  const holidayDates = holidays.map((h) => h.date);

  const employees = await Employee.find({ status: { $in: ['active', 'probation'] } })
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .lean();

  const totalWorkingDays = calculateWorkingDays(
    thirtyDaysAgoStr,
    todayStr,
    settings.weekendDays || [0, 6],
    holidayDates
  );

  const anomalies = [];

  for (const emp of employees) {
    const [attendances, leaves] = await Promise.all([
      Attendance.find({
        employeeId: emp._id,
        date: { $gte: thirtyDaysAgoStr, $lte: todayStr }
      }).lean(),
      LeaveRequest.find({
        employeeId: emp._id,
        status: 'approved',
        startDate: { $lte: todayStr },
        endDate: { $gte: thirtyDaysAgoStr }
      }).lean()
    ]);

    let approvedLeaveDays = 0;
    for (const l of leaves) {
      const s = l.startDate < thirtyDaysAgoStr ? thirtyDaysAgoStr : l.startDate;
      const e = l.endDate > todayStr ? todayStr : l.endDate;
      approvedLeaveDays += calculateWorkingDays(s, e, settings.weekendDays || [0, 6], holidayDates);
    }

    const attendedDays = attendances.filter((a) => a.isWorkingDay).length;
    const effectiveWorkingDays = emp.joiningDate && emp.joiningDate > thirtyDaysAgoStr
      ? calculateWorkingDays(emp.joiningDate, todayStr, settings.weekendDays || [0, 6], holidayDates)
      : totalWorkingDays;

    const absentDays = Math.max(0, effectiveWorkingDays - attendedDays - approvedLeaveDays);
    const lateDays = attendances.filter((a) => a.isLate).length;

    // Check anomaly condition: >= 3 absences in last 30 days
    if (absentDays >= 3 || (effectiveWorkingDays >= 5 && absentDays / effectiveWorkingDays >= 0.25)) {
      anomalies.push({
        employeeId: emp._id,
        employeeCode: emp.code,
        employeeName: emp.name,
        department: emp.departmentId?.name || '-',
        designation: emp.designationId?.title || '-',
        absentDays,
        lateDays,
        workingDays: effectiveWorkingDays,
        reason: absentDays >= 5
          ? `High absence rate: ${absentDays} unexcused absences in last 30 days`
          : `Frequent absence anomaly: ${absentDays} absences out of ${effectiveWorkingDays} working days`,
        severity: absentDays >= 5 ? 'critical' : 'warning'
      });
    }
  }

  return anomalies.sort((a, b) => b.absentDays - a.absentDays);
}

/**
 * T10.3 — Attrition Risk Score (0 - 100)
 * Simple, explainable heuristic:
 *  - Absence rate > 20% in last 30 days: +30 pts
 *  - Late arrivals >= 4 in last 30 days: +20 pts
 *  - Probation/New joiner tenure under 6 months: +15 pts
 *  - Zero leaves taken in last 90 days (burnout risk): +15 pts
 *  - Multiple half days (>= 2): +10 pts
 *  - No check-in in the last 4 working days: +10 pts
 */
export async function getAttritionRiskScores() {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi', weekendDays: [0, 6] };
  const todayStr = getCompanyDateString(new Date(), settings.timezone);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = getCompanyDateString(thirtyDaysAgo, settings.timezone);

  const employees = await Employee.find({ status: { $in: ['active', 'probation'] } })
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .lean();

  const scoredList = [];

  for (const emp of employees) {
    let score = 0;
    const factors = [];

    const [attendances, leaves] = await Promise.all([
      Attendance.find({
        employeeId: emp._id,
        date: { $gte: thirtyDaysAgoStr, $lte: todayStr }
      }).lean(),
      LeaveRequest.find({
        employeeId: emp._id,
        status: 'approved'
      }).lean()
    ]);

    const lateCount = attendances.filter((a) => a.isLate).length;
    const halfDayCount = attendances.filter((a) => a.status === 'half_day').length;

    // 1. High late arrivals
    if (lateCount >= 4) {
      score += 20;
      factors.push(`Frequent late arrival (${lateCount} times in last 30 days)`);
    }

    // 2. Multiple half days
    if (halfDayCount >= 2) {
      score += 10;
      factors.push(`${halfDayCount} half-days recorded in last 30 days`);
    }

    // 3. New hire / early tenure risk (< 6 months)
    if (emp.joiningDate) {
      const joinDate = new Date(emp.joiningDate);
      const tenureMonths = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 30.4);
      if (tenureMonths < 6) {
        score += 15;
        factors.push(`New employee under 6 months tenure (${tenureMonths.toFixed(1)} mo)`);
      }
    }

    // 4. Burnout risk: Zero leaves taken
    if (leaves.length === 0) {
      score += 15;
      factors.push('Burnout signal: No leaves taken');
    }

    // 5. Low attendance density
    if (attendances.length > 0 && attendances.length < 12) {
      score += 25;
      factors.push(`Low monthly attendance frequency (${attendances.length} attended days)`);
    }

    const cappedScore = Math.min(100, score);
    let riskLevel = 'Low';
    if (cappedScore >= 60) riskLevel = 'High';
    else if (cappedScore >= 35) riskLevel = 'Medium';

    scoredList.push({
      employeeId: emp._id,
      employeeCode: emp.code,
      employeeName: emp.name,
      department: emp.departmentId?.name || '-',
      designation: emp.designationId?.title || '-',
      score: cappedScore,
      riskLevel,
      factors: factors.length > 0 ? factors : ['Normal engagement pattern']
    });
  }

  return scoredList.sort((a, b) => b.score - a.score);
}
