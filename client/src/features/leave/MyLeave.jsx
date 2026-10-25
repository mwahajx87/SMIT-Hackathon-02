import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { Calendar, Plus, XCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';

export function MyLeave() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Smart Leave state
  const [smartText, setSmartText] = useState('');
  const [parsingSmart, setParsingSmart] = useState(false);
  const [isAiSuggested, setIsAiSuggested] = useState(false);

  // Live working days estimate (client preview; server validates accurately)
  const calculateEstimatedWorkingDays = (start, end) => {
    if (!start || !end || start > end) return 0;
    let count = 0;
    let cur = new Date(start + 'T00:00:00Z');
    const last = new Date(end + 'T00:00:00Z');
    while (cur <= last) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return count;
  };

  const estimatedDays = calculateEstimatedWorkingDays(startDate, endDate);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [balRes, histRes] = await Promise.all([
        apiRequest('/leave/balance'),
        apiRequest('/leave?limit=50')
      ]);
      setBalances(balRes || []);
      setHistory(histRes?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/leave', {
        method: 'POST',
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason
        })
      });
      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await apiRequest(`/leave/${id}/cancel`, { method: 'POST' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  const selectedBalance = balances.find((b) => b.leaveType === leaveType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">My leave</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Manage your leave balance, applications, and history.</p>
        </div>
        <Button onClick={() => setShowApplyModal(true)} size="sm" className="flex items-center gap-1.5 h-9">
          <Plus className="w-4 h-4 stroke-[1.75]" />
          <span>Apply for leave</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
          <span>{error}</span>
        </div>
      )}

      {/* Smart Leave AI Input Box per Section 5 */}
      <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--ai)]/30 space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--ai)] flex items-center gap-1.5">
            <span>✦ Describe your leave in your own words</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="e.g. Need next Monday and Tuesday off for my sister's wedding"
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ai)]"
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!smartText.trim() || parsingSmart) return;
                setParsingSmart(true);
                try {
                  const res = await apiRequest('/ai/smart-leave', {
                    method: 'POST',
                    body: JSON.stringify({ text: smartText })
                  });
                  if (res?.fallback || !res?.data) {
                    setShowApplyModal(true);
                  } else {
                    setLeaveType(res.data.leaveType);
                    setStartDate(res.data.startDate);
                    setEndDate(res.data.endDate);
                    setReason(res.data.reason);
                    setIsAiSuggested(true);
                    setShowApplyModal(true);
                  }
                } catch (err) {
                  setShowApplyModal(true);
                } finally {
                  setParsingSmart(false);
                }
              }
            }}
          />
          <Button
            size="sm"
            variant="ai"
            disabled={parsingSmart || !smartText.trim()}
            onClick={async () => {
              if (!smartText.trim() || parsingSmart) return;
              setParsingSmart(true);
              try {
                const res = await apiRequest('/ai/smart-leave', {
                  method: 'POST',
                  body: JSON.stringify({ text: smartText })
                });
                if (res?.fallback || !res?.data) {
                  setShowApplyModal(true);
                } else {
                  setLeaveType(res.data.leaveType);
                  setStartDate(res.data.startDate);
                  setEndDate(res.data.endDate);
                  setReason(res.data.reason);
                  setIsAiSuggested(true);
                  setShowApplyModal(true);
                }
              } catch (err) {
                setShowApplyModal(true);
              } finally {
                setParsingSmart(false);
              }
            }}
            className="h-9 px-3.5 text-xs shrink-0"
          >
            <span>{parsingSmart ? '✦ Filling...' : 'Fill the form ✦'}</span>
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))
          : balances.map((bal) => (
              <Card key={bal.leaveType} className="p-5 border-l-4 border-l-[var(--primary)]">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                  <span>{bal.name}</span>
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-[var(--text)] tabular-nums">
                    {bal.available === null ? '∞' : bal.available}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {bal.quota === null ? 'unlimited' : `left of ${bal.quota}d`}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[var(--text-muted)] flex justify-between border-t border-[var(--border)] pt-2">
                  <span>Approved: <strong className="text-[var(--text)] tabular-nums">{bal.approved}d</strong></span>
                  <span>Pending: <strong className="text-[var(--text)] tabular-nums">{bal.pending}d</strong></span>
                </div>
              </Card>
            ))}
      </div>

      {/* Leave Application History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">Leave history</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No leave requests yet"
              description="Apply for annual, sick, casual, or unpaid leave above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs font-medium border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Working days</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {history.map((req) => (
                  <tr key={req._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--text)] capitalize">
                      {req.leaveType}
                    </td>
                    <td className="px-5 py-4 text-[var(--text)] whitespace-nowrap font-mono tabular-nums text-xs">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="px-5 py-4 text-[var(--text)] font-mono tabular-nums text-xs">
                      {req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)] max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} />
                      {req.decisionComment && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 italic">
                          "{req.decisionComment}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {req.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(req._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs px-2 py-1"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Leave type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="annual">Annual leave</option>
              <option value="sick">Sick leave</option>
              <option value="casual">Casual leave</option>
              <option value="unpaid">Unpaid leave</option>
            </select>
            {selectedBalance && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Available balance: <strong className="text-[var(--text)] tabular-nums">{selectedBalance.available === null ? 'Unlimited' : `${selectedBalance.available} days`}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Start date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                End date
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Estimated working days:
              </span>
              <span className="font-semibold text-sm tabular-nums bg-blue-200/60 dark:bg-blue-800/40 px-2 py-0.5 rounded">
                {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Reason
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for taking leave..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowApplyModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (startDate && endDate && estimatedDays < 1)}
            >
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
