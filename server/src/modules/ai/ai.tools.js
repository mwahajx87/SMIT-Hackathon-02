import * as analyticsService from '../analytics/analytics.service.js';
import * as leaveService from '../leave/leave.service.js';
import * as payrollService from '../payroll/payroll.service.js';
import { Employee } from '../employees/employee.model.js';
import { Department } from '../org/org.models.js';

/**
 * Tool 1: get_headcount
 * Denied for employee role.
 */
export async function getHeadcountTool(args, ctx) {
  if (ctx.role === 'employee') {
    return { error: 'Access denied: Headcount statistics are restricted to HR and Admin.' };
  }
  const count = await analyticsService.getHeadcountMetric(args.asOf, args.departmentId);
  return { headcount: count };
}

/**
 * Tool 2: get_attendance_summary
 * Employee sees only own data.
 */
export async function getAttendanceSummaryTool(args, ctx) {
  const targetEmployeeId = ctx.role === 'employee' ? ctx.employeeId : args.employeeId;
  const metrics = await analyticsService.getAttendanceRateMetrics(
    args.from,
    args.to,
    args.departmentId,
    targetEmployeeId
  );
  return metrics;
}

/**
 * Tool 3: get_late_comers
 * Denied for employee role.
 */
export async function getLateComersTool(args, ctx) {
  if (ctx.role === 'employee') {
    return { error: 'Access denied: Attendance rank and late arrivals are private to HR and Admin.' };
  }
  const items = await analyticsService.getTopLateComers(args.from, args.to, args.limit || 5);
  return { lateComers: items };
}

/**
 * Tool 4: get_leave_summary
 * Employee sees only own data.
 */
export async function getLeaveSummaryTool(args, ctx) {
  const targetEmployeeId = ctx.role === 'employee' ? ctx.employeeId : args.employeeId;
  const utilization = await analyticsService.getLeaveUtilization(
    args.from,
    args.to,
    args.departmentId,
    targetEmployeeId
  );
  return { leaveUtilization: utilization };
}

/**
 * Tool 5: get_my_leave_balance
 * Always own data.
 */
export async function getMyLeaveBalanceTool(args, ctx) {
  if (!ctx.employeeId) {
    return { error: 'User is not linked to an employee record.' };
  }
  const year = args.year || String(new Date().getFullYear());
  const balances = await leaveService.getAllBalances(ctx.employeeId, year);
  return { balances };
}

/**
 * Tool 6: get_payroll_summary
 * Employee gets only own payslip summary.
 */
export async function getPayrollSummaryTool(args, ctx) {
  if (ctx.role === 'employee') {
    const payslips = await payrollService.getEmployeePayslips(ctx.employeeId, ctx);
    const latest = payslips[0];
    return {
      note: 'Employee access restricted to own salary.',
      lastMonth: latest?.month,
      netSalary: latest?.payslip?.netSalary,
      basicSalary: latest?.payslip?.basicSalary
    };
  }
  const summary = await analyticsService.getPayrollMetrics(args.month, args.departmentId);
  return summary;
}

/**
 * Tool 7: search_employees
 * Never reveals salary for non-admin/hr.
 */
export async function searchEmployeesTool(args, ctx) {
  const query = {};
  if (args.query) {
    query.$or = [
      { name: { $regex: args.query, $options: 'i' } },
      { code: { $regex: args.query, $options: 'i' } }
    ];
  }
  if (args.departmentId) query.departmentId = args.departmentId;

  const employees = await Employee.find(query)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .limit(10);

  return employees.map((emp) => {
    const item = {
      code: emp.code,
      name: emp.name,
      department: emp.departmentId?.name || '-',
      designation: emp.designationId?.title || '-'
    };
    // STRICT SECURITY: Never reveal colleague salary to Employee role
    if (['admin', 'hr'].includes(ctx.role)) {
      item.basicSalary = emp.salary?.basic;
    }
    return item;
  });
}

/**
 * Registry mapping tool name to implementation and function schema definition.
 */
export const AI_TOOLS_REGISTRY = {
  get_headcount: getHeadcountTool,
  get_attendance_summary: getAttendanceSummaryTool,
  get_late_comers: getLateComersTool,
  get_leave_summary: getLeaveSummaryTool,
  get_my_leave_balance: getMyLeaveBalanceTool,
  get_payroll_summary: getPayrollSummaryTool,
  search_employees: searchEmployeesTool
};

export const AI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_headcount',
      description: 'Get current company or department headcount. Denied to standard employees.',
      parameters: {
        type: 'object',
        properties: {
          departmentId: { type: 'string', description: 'Optional department ID' },
          asOf: { type: 'string', description: 'YYYY-MM-DD date' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_summary',
      description: 'Get attendance rate, present, late, absent, half-day counts.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          to: { type: 'string', description: 'End date YYYY-MM-DD' },
          departmentId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_late_comers',
      description: 'Get ranked list of frequent late-coming employees. Denied to employees.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'YYYY-MM-DD' },
          to: { type: 'string', description: 'YYYY-MM-DD' },
          limit: { type: 'number', description: 'Default 5' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_leave_summary',
      description: 'Get leave utilization by leave type.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          departmentId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_leave_balance',
      description: 'Get the logged-in employee current leave balances and available quotas.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'string', description: 'YYYY format, e.g. 2026' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_payroll_summary',
      description: 'Get gross, net and departmental payroll liabilities (or own payslip for employee).',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'YYYY-MM' },
          departmentId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: 'Search employees by name or code. Never discloses salaries to non-admin/hr.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Employee name or code' },
          departmentId: { type: 'string' }
        }
      }
    }
  }
];
