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
          <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">HR dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Workforce attendance, absenteeism, leave quotas, and operational trends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-9 px-3 border border-[var(--border)] rounded-lg text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All departments</option>
            {data?.departments?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <Button
            variant="ai"
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
            className="flex items-center gap-1.5 h-9"
          >
            <span>{summarizing ? '✦ Summarizing...' : '✦ Summarize'}</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={fetchDashboard} className="flex items-center gap-1.5 h-9">
            <RefreshCw className="w-4 h-4 stroke-[1.75]" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* AI Summary card with AI-generated badge and caption */}
      {aiSummary && (
        <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--ai)]/30 relative transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ai-soft)] text-[var(--ai)]">
                AI-generated
              </span>
              <span className="text-xs text-[var(--text-muted)]">Based on the current filters</span>
            </div>
            <button
              onClick={() => setAiSummary(null)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-medium"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2.5 text-xs text-[var(--text)] whitespace-pre-line leading-relaxed">
            {aiSummary}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* KPI Cards (5 columns per Section 5: Headcount | Present | On leave | Late | Pending approvals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 space-y-2 animate-pulse">
              <div className="h-3 bg-[var(--bg)] rounded w-20" />
              <div className="h-7 bg-[var(--bg)] rounded w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Headcount</span>
              <div className="my-2">
                <span className="text-[26px] leading-[32px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.headcount ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">In selected scope</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Present</span>
              <div className="my-2">
                <span className="text-[26px] leading-[32px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.presentCount ?? data?.kpis?.headcount ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">On time & late</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">On leave</span>
              <div className="my-2">
                <span className="text-[26px] leading-[32px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.onLeaveCount ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Approved leave</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Late</span>
              <div className="my-2">
                <span className="text-[26px] leading-[32px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.lateCount ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">After 09:15 AM</span>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
              <span className="text-xs font-normal text-[var(--text-muted)] leading-4">Pending approvals</span>
              <div className="my-2">
                <span className="text-[26px] leading-[32px] font-semibold text-[var(--text)] tabular-nums tracking-tight">
                  {data?.kpis?.pendingApprovals ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Requires review</span>
            </div>
          </>
        )}
      </div>

      {/* Attendance Metrics & Top Late Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] pb-3 border-b border-[var(--border)]">
            Attendance breakdown
          </h2>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Present (on-time)</span>
                <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">{data?.attendance?.present ?? 0}</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Late arrivals</span>
                <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mt-1 tabular-nums">{data?.attendance?.late ?? 0}</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Half-days (&lt;5h)</span>
                <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300 mt-1 tabular-nums">{data?.attendance?.halfDay ?? 0}</div>
              </div>
              <div className="p-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg">
                <span className="text-xs font-medium text-[var(--text-muted)]">Missing checkout</span>
                <div className="text-2xl font-semibold text-[var(--text)] mt-1 tabular-nums">{data?.attendance?.missingCheckout ?? 0}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Top 5 Late Comers */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] pb-3 border-b border-[var(--border)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Top 5 late-comers</span>
          </h2>

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
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-xs font-medium text-[var(--text)]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-[var(--text)]">{item.employeeName}</span>
                      <span className="text-xs text-[var(--text-muted)] block">{item.employeeCode}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium text-xs tabular-nums">
                    {item.lateCount}× late
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
          Leave utilization by type
        </h2>

        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {data?.leaveUtilization?.map((lt) => (
              <div key={lt.key} className="p-3 bg-[var(--surface-muted)] rounded-lg">
                <span className="text-xs font-medium text-[var(--text-muted)]">{lt.name}</span>
                <div className="text-xl font-semibold text-[var(--text)] mt-1 tabular-nums">
                  {lt.approvedDays}d {lt.yearlyQuota ? `/ ${lt.yearlyQuota}d` : ''}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
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
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Absence anomaly flags (last 30 days)</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 tabular-nums">
              {anomalies.length} flagged
            </span>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : anomalies.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ No attendance anomalies detected across teams.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] mt-3 max-h-64 overflow-y-auto">
              {anomalies.map((a) => (
                <div key={a.employeeId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-medium text-[var(--text)] block">{a.employeeName}</span>
                    <span className="text-[var(--text-muted)]">{a.employeeCode} · {a.department}</span>
                    <p className="text-rose-600 dark:text-rose-400 font-medium mt-1">{a.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-medium block tabular-nums">
                      {a.absentDays} absences
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block tabular-nums">{a.lateDays} lates</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Attrition Risk Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Attrition risk indicators</span>
            </h2>
            <span className="text-xs text-[var(--text-muted)]">Heuristic model</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : attritionRisk.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No employee risk factors identified.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] mt-3 max-h-64 overflow-y-auto">
              {attritionRisk.slice(0, 5).map((r) => (
                <div key={r.employeeId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text)]">{r.employeeName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.riskLevel === 'High'
                            ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                            : r.riskLevel === 'Medium'
                            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {r.riskLevel} risk
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)]">{r.employeeCode} · {r.department}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.factors?.map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[var(--surface-muted)] rounded text-[10px] text-[var(--text-muted)]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-semibold text-[var(--text)] tabular-nums">{r.score}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">/ 100</span>
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
