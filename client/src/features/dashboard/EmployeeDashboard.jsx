import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { CheckInWidget } from '../attendance/CheckInWidget.jsx';
import { apiRequest } from '../../lib/api.js';
import { Link } from 'react-router-dom';

export function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, annRes] = await Promise.allSettled([
        apiRequest('/dashboard/employee'),
        apiRequest('/announcements')
      ]);

      if (res.status === 'fulfilled') {
        setData(res.value);
      } else {
        setError(res.reason?.message || 'Failed to load dashboard data');
      }

      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value?.items?.slice(0, 3) || annRes.value?.slice(0, 3) || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const hoursWorked = data?.monthStats?.hoursWorked ?? 0;
  const targetHours = 40;
  const progressPercent = Math.min(Math.round((hoursWorked / targetHours) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Page Header Pattern */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">My dashboard</h1>
      </div>

      {error && (
        <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Top Row: Prominent Check-in Card (2/3) + Announcements (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CheckInWidget onStatusChange={fetchDashboard} />
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between" title="Announcements">
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : announcements.length > 0 ? (
                announcements.map((ann, idx) => (
                  <div key={ann._id || idx} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                    <span className="text-[var(--primary)] font-bold select-none">•</span>
                    <span className="leading-5 line-clamp-2 text-[var(--text)]">{ann.title || ann.message}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-2 text-xs text-[var(--text-muted)]">
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--primary)] font-bold select-none">•</span>
                    <span className="leading-5">Company payroll cut-off on 25th</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--primary)] font-bold select-none">•</span>
                    <span className="leading-5">Annual leave requests open for next month</span>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-[var(--border)] mt-4">
              <Link to="/announcements" className="text-xs font-medium text-[var(--primary)] hover:underline">
                View all announcements →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom KPI Row: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Hours this week */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
          <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Hours this week</span>
          <div className="my-2.5">
            <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
              {hoursWorked} <span className="text-base font-normal text-[var(--text-muted)]">/ {targetHours} h</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[var(--bg)] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[var(--primary)] h-1.5 rounded-full transition-all" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Late days this month */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
          <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Late days this month</span>
          <div className="my-2.5">
            <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
              {data?.monthStats?.lateCount ?? 0}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)] leading-4">After 09:15 AM</span>
        </div>

        {/* KPI 3: Sick leave left */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
          <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Sick leave left</span>
          <div className="my-2.5">
            <span className="text-[28px] leading-[36px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
              {data?.sickLeaveBalance ?? '8'} <span className="text-base font-normal text-[var(--text-muted)]">days</span>
            </span>
          </div>
          <Link to="/leave" className="text-xs text-[var(--primary)] hover:underline leading-4">
            Apply for leave
          </Link>
        </div>

        {/* KPI 4: Last payslip */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
          <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Last payslip</span>
          <div className="my-2.5">
            <span className="text-lg font-semibold text-[var(--text)] tracking-tight truncate block">
              {data?.lastPayslip?.month || 'September'}
            </span>
            <span className="text-xs text-[var(--text-muted)] block mt-0.5 tabular-nums">
              {data?.lastPayslip?.netSalary ? `PKR ${data.lastPayslip.netSalary.toLocaleString()}` : 'Disbursed'}
            </span>
          </div>
          <Link to="/payslips">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              View payslip
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

