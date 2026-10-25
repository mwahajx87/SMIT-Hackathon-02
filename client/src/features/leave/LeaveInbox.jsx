import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function LeaveInbox() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decision Modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [decisionType, setDecisionType] = useState('approved');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/leave/inbox?limit=50');
      setRequests(res?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const openDecisionModal = (req, type) => {
    setActiveRequest(req);
    setDecisionType(type);
    setComment('');
    setDecisionError(null);
  };

  const handleDecision = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setDecisionError('Decision comment is mandatory.');
      return;
    }
    setSubmitting(true);
    setDecisionError(null);
    try {
      await apiRequest(`/leave/${activeRequest._id}/decide`, {
        method: 'POST',
        body: JSON.stringify({
          status: decisionType,
          decisionComment: comment
        })
      });
      setActiveRequest(null);
      fetchInbox();
    } catch (err) {
      setDecisionError(err.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Leave inbox</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Review and decide on pending employee leave applications</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchInbox} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Pending approvals ({requests.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Inbox is clear"
              description="There are no pending leave requests awaiting approval."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs font-medium border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Leave type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Working days</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--text)]">{req.employeeId?.name || 'Unknown'}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {req.employeeId?.code} • {req.employeeId?.departmentId?.name || 'No Dept'}
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize font-medium text-[var(--text)]">
                      {req.leaveType}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs tabular-nums text-[var(--text)] whitespace-nowrap">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs tabular-nums text-[var(--text)] font-medium">
                      {req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)] text-xs max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDecisionModal(req, 'approved')}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-2.5 py-1 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDecisionModal(req, 'rejected')}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 text-xs"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Decision Modal */}
      <Modal
        isOpen={Boolean(activeRequest)}
        onClose={() => setActiveRequest(null)}
        title={decisionType === 'approved' ? 'Approve leave request' : 'Reject leave request'}
      >
        <form onSubmit={handleDecision} className="space-y-4">
          {decisionError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-rose-600 dark:text-rose-400 text-xs">
              {decisionError}
            </div>
          )}

          {activeRequest && (
            <div className="p-3.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-xs space-y-1 text-[var(--text)]">
              <div><strong className="text-[var(--text-muted)]">Applicant:</strong> {activeRequest.employeeId?.name} ({activeRequest.employeeId?.code})</div>
              <div><strong className="text-[var(--text-muted)]">Type:</strong> <span className="capitalize">{activeRequest.leaveType}</span></div>
              <div><strong className="text-[var(--text-muted)]">Duration:</strong> {activeRequest.startDate} to {activeRequest.endDate} ({activeRequest.workingDays} working days)</div>
              <div><strong className="text-[var(--text-muted)]">Reason:</strong> {activeRequest.reason}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Decision comment <span className="text-[var(--text-muted)]">(required)</span>
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={decisionType === 'approved' ? 'e.g. Approved, please coordinate coverage' : 'e.g. Declined due to scheduled project deliverables'}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              A written comment is required for all approvals and rejections.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveRequest(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionType === 'approved' ? 'primary' : 'danger'}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? 'Submitting...' : decisionType === 'approved' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
