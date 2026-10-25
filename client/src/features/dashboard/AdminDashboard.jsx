import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  CircleDollarSign,
  AlertTriangle,
  RefreshCw,
  Building,
  UserX
} from 'lucide-react';

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/dashboard/admin');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load executive metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">Admin dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Workforce health, payroll liabilities, and operational attendance overview.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDashboard} className="flex items-center gap-1.5 h-9">
          <RefreshCw className="w-4 h-4 stroke-[1.75]" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* KPI Cards (No icons, sentence case, 28px/36px tabular numbers, 1px border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-[var(--bg)] rounded w-28" />
              <div className="h-8 bg-[var(--bg)] rounded w-20" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Total headcount</span>
              <div className="my-2.5">
                <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.headcount ?? 0}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] leading-4">Active and probation</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Attendance rate</span>
              <div className="my-2.5">
                <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.attendanceRate ?? 100}%
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] leading-4">Present and half days</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Monthly payroll cost</span>
              <div className="my-2.5">
                <span className="text-[24px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight truncate">
                  PKR {data?.kpis?.payrollCost?.toLocaleString() ?? 0}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] leading-4">Net disbursement</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Attrition rate (YTD)</span>
              <div className="my-2.5">
                <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.attritionRate ?? 0}%
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] leading-4">Exits vs average headcount</span>
            </div>
          </>
        )}
      </div>

      {/* Department Breakdown & Top Late Comers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll by Department */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <Building className="w-4 h-4 text-[var(--primary)] stroke-[1.75]" />
              <span>Payroll cost by department</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data?.payrollSummary?.byDepartment?.length ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No finalized payroll data available yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] mt-3">
              {data.payrollSummary.byDepartment.map((dept) => (
                <div key={dept.department} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-[var(--text)]">{dept.department}</span>
                    <span className="text-xs text-[var(--text-muted)] block">{dept.count} employees</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[var(--text)] tabular-nums">PKR {dept.net?.toLocaleString()}</span>
                    <span className="text-[11px] text-[var(--text-muted)] block tabular-nums">Avg: PKR {dept.averageSalary?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Late-Comers */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[1.75]" />
              <span>Top frequent late-comers</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data?.topLateComers?.length ? (
            <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              No late arrivals recorded in this period.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] mt-3">
              {data.topLateComers.map((item, idx) => (
                <div key={item._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--bg)] flex items-center justify-center text-xs font-semibold text-[var(--text)] select-none">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{item.employeeName}</span>
                      <span className="text-xs text-[var(--text-muted)] block">{item.employeeCode}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium text-xs border border-amber-200 dark:border-amber-800/30">
                    <span className="tabular-nums font-mono">{item.lateCount}</span> times late
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Leave Utilization Breakdown */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--text)] pb-3 border-b border-[var(--border)]">
          Leave type utilization
        </h2>

        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {data?.leaveUtilization?.map((lt) => (
              <div key={lt.key} className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--text-muted)] capitalize">{lt.name}</span>
                <div className="text-xl font-semibold text-[var(--text)] tabular-nums mt-1">
                  {lt.approvedDays}d {lt.yearlyQuota ? `/ ${lt.yearlyQuota}d` : ''}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 tabular-nums">
                  {lt.utilizationRate !== null ? `${lt.utilizationRate}% utilized` : 'Unlimited quota'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
