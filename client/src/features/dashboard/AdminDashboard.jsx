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
          <h1 className="text-2xl font-bold text-[#1F2A44]">Admin Executive Dashboard</h1>
          <p className="text-sm text-[#6B7385]">
            Company-wide workforce health, payroll liabilities, and operational attendance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5 border-l-4 border-l-[#12A087]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Total Headcount</span>
                <Users className="w-4 h-4 text-[#12A087]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.headcount ?? 0}
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Active & on probation</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Attendance Rate</span>
                <CalendarCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.attendanceRate ?? 100}%
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Present, late & half-days</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Monthly Payroll</span>
                <CircleDollarSign className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#1F2A44]">
                PKR {data?.kpis?.payrollCost?.toLocaleString() ?? 0}
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Net disbursement</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Attrition Rate</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.attritionRate ?? 0}%
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Exits / avg headcount</span>
            </Card>
          </>
        )}
      </div>

      {/* Department Breakdown & Top Late Comers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll by Department */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
            <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#12A087]" />
              <span>Payroll Cost by Department</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data?.payrollSummary?.byDepartment?.length ? (
            <div className="p-8 text-center text-xs text-[#6B7385]">
              No finalized payroll data available yet.
            </div>
          ) : (
            <div className="divide-y divide-[#E3E7EE] mt-3">
              {data.payrollSummary.byDepartment.map((dept) => (
                <div key={dept.department} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-[#1F2A44]">{dept.department}</span>
                    <span className="text-xs text-[#6B7385] block">{dept.count} employees</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1F2A44]">PKR {dept.net?.toLocaleString()}</span>
                    <span className="text-[11px] text-[#6B7385] block">Avg: PKR {dept.averageSalary?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Late-Comers */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
            <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Top Frequent Late-Comers</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data?.topLateComers?.length ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              Excellent! No late arrivals recorded in this period.
            </div>
          ) : (
            <div className="divide-y divide-[#E3E7EE] mt-3">
              {data.topLateComers.map((item, idx) => (
                <div key={item._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-[#1F2A44]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-[#1F2A44]">{item.employeeName}</span>
                      <span className="text-xs text-[#6B7385] block">{item.employeeCode}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-bold text-xs">
                    {item.lateCount} times late
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Leave Utilization Breakdown */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider pb-3 border-b border-[#E3E7EE]">
          Leave Type Utilization
        </h2>

        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {data?.leaveUtilization?.map((lt) => (
              <div key={lt.key} className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-[#6B7385] uppercase">{lt.name}</span>
                <div className="text-xl font-bold text-[#1F2A44] mt-1">
                  {lt.approvedDays}d {lt.yearlyQuota ? `/ ${lt.yearlyQuota}d` : ''}
                </div>
                <div className="text-xs text-[#6B7385] mt-1">
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
