import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';

export function AttendanceBoard() {
  const [tab, setTab] = useState('board'); // board | corrections
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [boardData, setBoardData] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState({ open: false, id: null, status: 'approved' });
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/attendance/board?date=${selectedDate}`);
      setBoardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCorrections = async () => {
    try {
      const data = await apiRequest('/attendance/corrections?status=pending');
      setCorrections(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'board') {
      loadBoard();
    } else {
      loadCorrections();
    }
  }, [selectedDate, tab]);

  const handleDecide = async (e) => {
    e.preventDefault();
    setDecisionLoading(true);
    try {
      await apiRequest(`/attendance/corrections/${decisionModal.id}/decide`, {
        method: 'POST',
        body: JSON.stringify({
          status: decisionModal.status,
          decisionComment
        })
      });
      setDecisionModal({ open: false, id: null, status: 'approved' });
      setDecisionComment('');
      loadCorrections();
    } catch (err) {
      alert(err.message || 'Decision failed.');
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Attendance operations</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time daily attendance board, status snapshots, and correction request inbox
          </p>
        </div>

        {tab === 'board' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        <button
          onClick={() => setTab('board')}
          className={`pb-3 border-b-2 font-medium transition-colors ${
            tab === 'board'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Daily attendance board
        </button>
        <button
          onClick={() => setTab('corrections')}
          className={`pb-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
            tab === 'corrections'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <span>Corrections inbox</span>
          {corrections.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--warning-soft)] text-[var(--warning)] font-medium">
              {corrections.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Attendance Board */}
      {tab === 'board' && boardData && (
        <div className="space-y-4">
          {/* Summary Chips */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-muted)] block">Total staff</span>
              <span className="text-2xl font-semibold text-[var(--text)] mt-1 block font-mono tabular-nums">{boardData.summary?.total}</span>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--success)] block">Present</span>
              <span className="text-2xl font-semibold text-[var(--success)] mt-1 block font-mono tabular-nums">{boardData.summary?.present}</span>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--warning)] block">Late</span>
              <span className="text-2xl font-semibold text-[var(--warning)] mt-1 block font-mono tabular-nums">{boardData.summary?.late}</span>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--warning)] block">Half day</span>
              <span className="text-2xl font-semibold text-[var(--warning)] mt-1 block font-mono tabular-nums">{boardData.summary?.halfDay}</span>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-muted)] block">Not in yet</span>
              <span className="text-2xl font-semibold text-[var(--text-muted)] mt-1 block font-mono tabular-nums">{boardData.summary?.notCheckedIn}</span>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                <thead className="bg-[var(--surface-muted)] text-xs font-medium text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Worked duration</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                  {boardData.items?.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium block text-[var(--text)]">{row.employee.name}</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">{row.employee.code}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{row.employee.department}</td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text)]">
                        {row.checkInAt
                          ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text)]">
                        {row.checkOutAt
                          ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono tabular-nums text-[var(--text)]">
                        {row.workedMinutes ? `${Math.floor(row.workedMinutes / 60)}h ${row.workedMinutes % 60}m` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Corrections Inbox */}
      {tab === 'corrections' && (
        <Card title="Pending attendance corrections">
          {corrections.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No pending attendance correction requests to review.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {corrections.map((c) => (
                <div key={c._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text)]">{c.employeeId?.name}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">({c.employeeId?.code})</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                        Date: {c.date}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1 font-mono tabular-nums">
                      Requested: {c.requestedCheckIn || '--:--'} to {c.requestedCheckOut || '--:--'}
                    </p>
                    <p className="text-xs text-[var(--text)] mt-1.5 bg-[var(--surface-muted)] p-2.5 rounded-lg border border-[var(--border)]">
                      <strong className="text-[var(--text-muted)]">Reason:</strong> {c.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setDecisionModal({ open: true, id: c._id, status: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDecisionModal({ open: true, id: c._id, status: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModal.open}
        onClose={() => setDecisionModal({ open: false, id: null, status: 'approved' })}
        title={`${decisionModal.status === 'approved' ? 'Approve' : 'Reject'} correction request`}
      >
        <form onSubmit={handleDecide} className="space-y-4">
          <FormField
            label="Decision comment"
            required
            helperText="A comment is required for the audit record."
          >
            <textarea
              rows={3}
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              required
              placeholder="e.g. Approved as per manager confirmation..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDecisionModal({ open: false, id: null, status: 'approved' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionModal.status === 'approved' ? 'primary' : 'danger'}
              loading={decisionLoading}
            >
              Confirm {decisionModal.status === 'approved' ? 'approval' : 'rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
