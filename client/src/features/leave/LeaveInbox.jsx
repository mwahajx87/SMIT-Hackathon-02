import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Calendar } from 'lucide-react';

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
          <h1 className="text-2xl font-bold text-[#1F2A44]">Leave Inbox</h1>
          <p className="text-sm text-[#6B7385]">Review and decide on pending employee leave applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInbox} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E3E7EE] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2A44]">
            Pending Approvals ({requests.length})
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
              <thead className="bg-[#F8FAFC] text-[#6B7385] text-xs uppercase font-medium border-b border-[#E3E7EE]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Leave Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Working Days</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EE]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#1F2A44]">{req.employeeId?.name || 'Unknown'}</div>
                      <div className="text-xs text-[#6B7385]">
                        {req.employeeId?.code} • {req.employeeId?.departmentId?.name || 'No Dept'}
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize font-medium text-[#1F2A44]">
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
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDecisionModal(req, 'approved')}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDecisionModal(req, 'rejected')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 text-xs"
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
        title={decisionType === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
      >
        <form onSubmit={handleDecision} className="space-y-4">
          {decisionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {decisionError}
            </div>
          )}

          {activeRequest && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 text-[#1F2A44]">
              <div><strong>Applicant:</strong> {activeRequest.employeeId?.name} ({activeRequest.employeeId?.code})</div>
              <div><strong>Type:</strong> <span className="capitalize">{activeRequest.leaveType}</span></div>
              <div><strong>Duration:</strong> {activeRequest.startDate} to {activeRequest.endDate} ({activeRequest.workingDays} working days)</div>
              <div><strong>Reason:</strong> {activeRequest.reason}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Decision Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={decisionType === 'approved' ? 'e.g., Approved, please arrange handover' : 'e.g., Rejected due to staffing requirements during this period'}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            />
            <p className="text-[11px] text-[#6B7385] mt-1">
              A written comment is required for all approvals and rejections.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveRequest(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !comment.trim()}
              className={decisionType === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {submitting ? 'Submitting...' : decisionType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
