import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { apiRequest } from '../../lib/api.js';
import { ShieldAlert, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export function AuditScreen() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);

      const res = await apiRequest(`/audit?${params.toString()}`);
      setLogs(res?.items || []);
      setPagination(res?.pagination || { page, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A44] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#12A087]" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-sm text-[#6B7385]">
            Append-only system record of all administrative actions, salary changes, and approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
          >
            <option value="">All Actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="finalize">finalize</option>
            <option value="cancel">cancel</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
          >
            <option value="">All Entities</option>
            <option value="employee">employee</option>
            <option value="leave_request">leave_request</option>
            <option value="payroll_run">payroll_run</option>
            <option value="attendance_correction">attendance_correction</option>
            <option value="announcement">announcement</option>
            <option value="settings">settings</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs(pagination.page)} className="p-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E3E7EE] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider">
            Audit Events ({pagination.total})
          </h2>
          <span className="text-xs text-[#6B7385]">Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No audit entries found"
              description="Events matching the current filter will be recorded here automatically."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#6B7385] uppercase font-semibold border-b border-[#E3E7EE]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">State Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EE] font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-[#6B7385] whitespace-nowrap">
                      {new Date(log.at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#1F2A44]">{log.actorId?.email || 'System'}</div>
                      <span className="text-[10px] uppercase font-bold text-[#12A087]">{log.actorRole}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        log.action === 'finalize' ? 'bg-purple-100 text-purple-800' :
                        log.action === 'approve' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'reject' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#1F2A44]">
                      {log.entity}
                    </td>
                    <td className="px-5 py-3 text-[#6B7385] max-w-[120px] truncate" title={log.entityId}>
                      {log.entityId}
                    </td>
                    <td className="px-5 py-3 text-[#334155] max-w-xs truncate" title={JSON.stringify(log.after || log.before)}>
                      {JSON.stringify(log.after || log.before)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E3E7EE] flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchAuditLogs(pagination.page - 1)}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <span className="text-xs text-[#6B7385]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchAuditLogs(pagination.page + 1)}
              className="flex items-center gap-1 text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
