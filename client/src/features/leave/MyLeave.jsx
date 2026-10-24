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
          <h1 className="text-2xl font-bold text-[#1F2A44]">My Leave</h1>
          <p className="text-sm text-[#6B7385]">Manage your leave balance, applications, and history</p>
        </div>
        <Button onClick={() => setShowApplyModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Smart Leave AI Input Box */}
      <Card className="p-4 bg-gradient-to-r from-[#5B4FCF]/5 to-transparent border border-[#5B4FCF]/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#5B4FCF] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1F2A44] block">Smart AI Leave Application</span>
              <span className="text-[11px] text-[#6B7385]">Type naturally (e.g. "Next Monday and Tuesday for personal work")</span>
            </div>
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              placeholder="e.g. Taking annual leave from next Wednesday to Friday for my sister's wedding"
              className="flex-1 px-3 py-1.5 border border-[#E3E7EE] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#5B4FCF]"
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
              className="bg-[#5B4FCF] hover:bg-[#4A3EB5] text-white text-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>{parsingSmart ? 'Analyzing...' : 'Parse with AI'}</span>
            </Button>
          </div>
        </div>
      </Card>

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
              <Card key={bal.leaveType} className="p-5 border-l-4 border-l-[#12A087]">
                <div className="flex items-center justify-between text-xs text-[#6B7385] font-semibold uppercase">
                  <span>{bal.name}</span>
                  <Calendar className="w-4 h-4 text-[#12A087]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#1F2A44]">
                    {bal.available === null ? '∞' : bal.available}
                  </span>
                  <span className="text-xs text-[#6B7385]">
                    {bal.quota === null ? 'unlimited' : `left of ${bal.quota}d`}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[#6B7385] flex justify-between border-t border-[#E3E7EE] pt-2">
                  <span>Approved: <strong>{bal.approved}d</strong></span>
                  <span>Pending: <strong>{bal.pending}d</strong></span>
                </div>
              </Card>
            ))}
      </div>

      {/* Leave Application History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E3E7EE]">
          <h2 className="text-base font-bold text-[#1F2A44]">Leave History</h2>
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
              <thead className="bg-[#F8FAFC] text-[#6B7385] text-xs uppercase font-medium border-b border-[#E3E7EE]">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Working Days</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EE]">
                {history.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#1F2A44] capitalize">
                      {req.leaveType}
                    </td>
                    <td className="px-5 py-4 text-[#1F2A44] whitespace-nowrap">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="px-5 py-4 text-[#1F2A44] font-semibold">
                      {req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-5 py-4 text-[#6B7385] max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} />
                      {req.decisionComment && (
                        <p className="text-[11px] text-[#6B7385] mt-1 italic">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
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
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            {selectedBalance && (
              <p className="text-xs text-[#6B7385] mt-1">
                Available balance: <strong>{selectedBalance.available === null ? 'Unlimited' : `${selectedBalance.available} days`}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-600" />
                Estimated Working Days:
              </span>
              <span className="font-bold text-sm bg-blue-200/60 px-2 py-0.5 rounded">
                {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Reason
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for taking leave..."
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApplyModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (startDate && endDate && estimatedDays < 1)}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
