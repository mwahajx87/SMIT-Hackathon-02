import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { CheckInWidget } from '../attendance/CheckInWidget.jsx';
import { apiRequest } from '../../lib/api.js';
import {
  Clock,
  CalendarCheck,
  CircleDollarSign,
  CalendarDays,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/dashboard/employee');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load your personal dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2A44]">My Workplace Dashboard</h1>
        <p className="text-sm text-[#6B7385]">
          Your daily punch clock, worked hours, attendance status, and recent salary
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Grid: Check-in widget on Left, Monthly KPIs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In/Punch Clock Card */}
        <div className="lg:col-span-1">
          <CheckInWidget onCheckInOut={fetchDashboard} />
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))
            ) : (
              <>
                <Card className="p-5 border-l-4 border-l-[#12A087]">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                    <span>Hours Worked</span>
                    <Clock className="w-4 h-4 text-[#12A087]" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1F2A44]">
                    {data?.monthStats?.hoursWorked ?? 0}h
                  </div>
                  <span className="text-xs text-[#6B7385] mt-1 block">This month</span>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                    <span>Late Arrivals</span>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-[#1F2A44]">
                    {data?.monthStats?.lateCount ?? 0}
                  </div>
                  <span className="text-xs text-[#6B7385] mt-1 block">Times after 09:15 AM</span>
                </Card>

                <Card className="p-5 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                    <span>Today's Status</span>
                    <CalendarCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {data?.todayAttendance ? (
                      <StatusBadge status={data.todayAttendance.status} />
                    ) : (
                      <span className="text-xs text-[#6B7385] italic font-medium">Not Checked In</span>
                    )}
                  </div>
                  <span className="text-xs text-[#6B7385] mt-2 block">
                    {data?.todayAttendance?.workedMinutes
                      ? `${Math.round(data.todayAttendance.workedMinutes / 60)}h worked`
                      : 'Punch in above'}
                  </span>
                </Card>
              </>
            )}
          </div>

          {/* Quick Actions & Recent Payslip Card */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider pb-2 border-b border-[#E3E7EE]">
              Latest Payslip & Quick Links
            </h2>

            {loading ? (
              <Skeleton className="h-14 w-full" />
            ) : data?.lastPayslip ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <CircleDollarSign className="w-8 h-8 text-[#12A087]" />
                  <div>
                    <span className="font-bold text-[#1F2A44] text-sm">
                      {data.lastPayslip.month} Salary Disbursed
                    </span>
                    <span className="text-xs text-[#6B7385] block">
                      Net: PKR {data.lastPayslip.netSalary?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link to="/payslips">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Slip
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-xs text-[#6B7385]">
                No finalized payslips available for download yet.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/leave"
                className="p-3 border border-[#E3E7EE] rounded-lg hover:border-[#12A087] transition-all flex items-center gap-3 group bg-white"
              >
                <CalendarDays className="w-5 h-5 text-[#12A087] group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-[#1F2A44] block">Apply for Leave</span>
                  <span className="text-[11px] text-[#6B7385]">Check your balance</span>
                </div>
              </Link>

              <Link
                to="/attendance"
                className="p-3 border border-[#E3E7EE] rounded-lg hover:border-[#12A087] transition-all flex items-center gap-3 group bg-white"
              >
                <CalendarCheck className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-[#1F2A44] block">My Attendance</span>
                  <span className="text-[11px] text-[#6B7385]">Monthly calendar & logs</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
