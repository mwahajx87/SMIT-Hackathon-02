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
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Audit trail
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Append-only system record of all administrative actions, salary changes, and approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="finalize">Finalize</option>
            <option value="cancel">Cancel</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All entities</option>
            <option value="employee">Employee</option>
            <option value="leave_request">Leave request</option>
            <option value="payroll_run">Payroll run</option>
            <option value="attendance_correction">Attendance correction</option>
            <option value="announcement">Announcement</option>
            <option value="settings">Settings</option>
          </select>

          <Button variant="secondary" size="sm" onClick={() => fetchAuditLogs(pagination.page)} className="p-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Audit events ({pagination.total})
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">Page {pagination.page} of {pagination.totalPages}</span>
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
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">State snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-[11px] tabular-nums">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                    <td className="px-5 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--text)]">{log.actorId?.email || 'System'}</div>
                      <span className="text-[10px] capitalize font-medium text-[var(--primary)]">{log.actorRole}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                        log.action === 'finalize' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300' :
                        log.action === 'approve' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' :
                        log.action === 'reject' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300' :
                        'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--text)]">
                      {log.entity}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] max-w-[120px] truncate" title={log.entityId}>
                      {log.entityId}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] max-w-xs truncate" title={JSON.stringify(log.after || log.before)}>
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
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchAuditLogs(pagination.page - 1)}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
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
