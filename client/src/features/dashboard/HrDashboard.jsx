import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import {
  Users,
  CalendarCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function HrDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [attritionRisk, setAttritionRisk] = useState([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = departmentId ? `?departmentId=${departmentId}` : '';
      const [res, anomRes, riskRes] = await Promise.all([
        apiRequest(`/dashboard/hr${query}`),
        apiRequest('/dashboard/anomalies').catch(() => ({ data: [] })),
        apiRequest('/dashboard/attrition-risk').catch(() => ({ data: [] }))
      ]);
      setData(res);
      setAnomalies(anomRes?.data || []);
      setAttritionRisk(riskRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load HR metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [departmentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A44]">HR Operations Dashboard</h1>
          <p className="text-sm text-[#6B7385]">
            Track employee attendance, late arrivals, on-time rates, and leave quotas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-1.5 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
          >
            <option value="">All Departments</option>
            {data?.departments?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!data) return;
              setSummarizing(true);
              try {
                const res = await apiRequest('/ai/summary', {
                  method: 'POST',
                  body: JSON.stringify({ kpis: data.kpis })
                });
                setAiSummary(res.summary);
              } catch (err) {
                alert(err.message || 'Failed to generate summary');
              } finally {
                setSummarizing(false);
              }
            }}
            disabled={summarizing}
            className="flex items-center gap-1.5 text-[#5B4FCF] border-[#5B4FCF]/30 hover:bg-[#5B4FCF]/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>{summarizing ? 'Summarizing...' : 'AI Summary'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={fetchDashboard} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {aiSummary && (
        <Card className="p-4 bg-[#5B4FCF]/5 border border-[#5B4FCF]/20 relative">
          <div className="flex items-center justify-between pb-2 border-b border-[#5B4FCF]/10">
            <span className="text-xs font-bold text-[#5B4FCF] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Executive Summary</span>
            </span>
            <button
              onClick={() => setAiSummary(null)}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2 text-xs text-[#1F2A44] whitespace-pre-line leading-relaxed">
            {aiSummary}
          </div>
        </Card>
      )}

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
                <span>Active Headcount</span>
                <Users className="w-4 h-4 text-[#12A087]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.headcount ?? 0}
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">In selected scope</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Attendance Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.attendanceRate ?? 100}%
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Present, late & half-day</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Late Arrival %</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.kpis?.latePercentage ?? 0}%
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">Arrived after 09:15 AM</span>
            </Card>

            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7385] uppercase">
                <span>Total Present</span>
                <CalendarCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#1F2A44]">
                {data?.attendance?.present ?? 0}
              </div>
              <span className="text-xs text-[#6B7385] mt-1 block">On-time attendances</span>
            </Card>
          </>
        )}
      </div>

      {/* Attendance Metrics & Top Late Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider pb-3 border-b border-[#E3E7EE]">
            Attendance Breakdown (Selected Scope)
          </h2>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <span className="text-xs font-semibold text-emerald-800 uppercase">Present (On-Time)</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{data?.attendance?.present ?? 0}</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-xs font-semibold text-amber-800 uppercase">Late Arrivals</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">{data?.attendance?.late ?? 0}</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs font-semibold text-blue-800 uppercase">Half-Days (&lt;5h)</span>
                <div className="text-2xl font-bold text-blue-700 mt-1">{data?.attendance?.halfDay ?? 0}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-semibold text-[#6B7385] uppercase">Missing Checkout</span>
                <div className="text-2xl font-bold text-[#1F2A44] mt-1">{data?.attendance?.missingCheckout ?? 0}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Top 5 Late Comers */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider pb-3 border-b border-[#E3E7EE] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Top 5 Late-Comers</span>
          </h2>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data?.topLateComers?.length ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              No late arrivals recorded in this period.
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
          Department Leave Utilization
        </h2>

        {loading ? (
          <div className="p-4 space-y-2">
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

      {/* Phase 10 T10.3: Absence Anomaly Flags & Attrition Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absence Anomaly Flags */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
            <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Absence Anomaly Flags (Last 30 Days)</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700">
              {anomalies.length} Flagged
            </span>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : anomalies.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              ✓ No attendance anomalies detected across teams.
            </div>
          ) : (
            <div className="divide-y divide-[#E3E7EE] mt-3 max-h-64 overflow-y-auto">
              {anomalies.map((a) => (
                <div key={a.employeeId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[#1F2A44] block">{a.employeeName}</span>
                    <span className="text-[#6B7385]">{a.employeeCode} • {a.department}</span>
                    <p className="text-rose-600 font-medium mt-1">{a.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold block">
                      {a.absentDays} Absences
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 block">{a.lateDays} lates</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Attrition Risk Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
            <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Attrition Risk Indicators</span>
            </h2>
            <span className="text-xs text-[#6B7385]">Explainable Heuristic</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : attritionRisk.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7385]">
              No employee risk factors identified.
            </div>
          ) : (
            <div className="divide-y divide-[#E3E7EE] mt-3 max-h-64 overflow-y-auto">
              {attritionRisk.slice(0, 5).map((r) => (
                <div key={r.employeeId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1F2A44]">{r.employeeName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.riskLevel === 'High'
                            ? 'bg-red-100 text-red-700'
                            : r.riskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.riskLevel} Risk
                      </span>
                    </div>
                    <span className="text-[#6B7385]">{r.employeeCode} • {r.department}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.factors?.map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-[#1F2A44]">{r.score}</span>
                    <span className="text-[10px] text-[#6B7385] block">/ 100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
