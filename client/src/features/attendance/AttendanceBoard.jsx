import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Calendar, Users, CheckCircle2, Clock, XCircle, Inbox } from 'lucide-react';

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
          <h1 className="text-xl font-bold text-[#1F2A44]">Attendance Operations</h1>
          <p className="text-xs text-[#6B7385] mt-1">
            Real-time daily attendance board, status snapshots, and correction request inbox.
          </p>
        </div>

        {tab === 'board' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7385]">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-[#E3E7EE] rounded-lg text-sm bg-white"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3E7EE] gap-6 text-sm font-medium">
        <button
          onClick={() => setTab('board')}
          className={`pb-3 border-b-2 font-medium ${
            tab === 'board'
              ? 'border-[#12A087] text-[#12A087]'
              : 'border-transparent text-[#6B7385] hover:text-[#1F2A44]'
          }`}
        >
          Daily Attendance Board
        </button>
        <button
          onClick={() => setTab('corrections')}
          className={`pb-3 border-b-2 font-medium flex items-center gap-2 ${
            tab === 'corrections'
              ? 'border-[#12A087] text-[#12A087]'
              : 'border-transparent text-[#6B7385] hover:text-[#1F2A44]'
          }`}
        >
          <span>Corrections Inbox</span>
          {corrections.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E9962B] text-white font-bold">
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
            <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] text-center">
              <span className="text-xs text-[#6B7385] block uppercase font-medium">Total Staff</span>
              <span className="text-xl font-bold text-[#1F2A44]">{boardData.summary?.total}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#2E9E5B]/20 text-center">
              <span className="text-xs text-[#2E9E5B] block uppercase font-medium">Present</span>
              <span className="text-xl font-bold text-[#2E9E5B]">{boardData.summary?.present}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E9962B]/20 text-center">
              <span className="text-xs text-[#E9962B] block uppercase font-medium">Late</span>
              <span className="text-xl font-bold text-[#E9962B]">{boardData.summary?.late}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E9962B]/20 text-center">
              <span className="text-xs text-[#E9962B] block uppercase font-medium">Half Day</span>
              <span className="text-xl font-bold text-[#E9962B]">{boardData.summary?.halfDay}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-[#6B7385] block uppercase font-medium">Not In Yet</span>
              <span className="text-xl font-bold text-[#6B7385]">{boardData.summary?.notCheckedIn}</span>
            </div>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E3E7EE] text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-[#6B7385]">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Worked Duration</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7EE] text-[#1F2A44]">
                  {boardData.items?.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className="font-semibold block">{row.employee.name}</span>
                        <span className="font-mono text-xs text-[#6B7385]">{row.employee.code}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7385]">{row.employee.department}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.checkInAt
                          ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.checkOutAt
                          ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.workedMinutes ? `${Math.floor(row.workedMinutes / 60)}h ${row.workedMinutes % 60}m` : '-'}
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
        <Card title="Pending Attendance Corrections">
          {corrections.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7385]">
              No pending attendance correction requests to review.
            </div>
          ) : (
            <div className="divide-y divide-[#E3E7EE]">
              {corrections.map((c) => (
                <div key={c._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1F2A44]">{c.employeeId?.name}</span>
                      <span className="font-mono text-xs text-[#6B7385]">({c.employeeId?.code})</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#1F2A44]">
                        Date: {c.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7385] mt-1">
                      Requested: {c.requestedCheckIn || '--:--'} to {c.requestedCheckOut || '--:--'}
                    </p>
                    <p className="text-xs text-[#1F2A44] mt-1 bg-gray-50 p-2 rounded">
                      <strong>Reason:</strong> {c.reason}
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
        title={`${decisionModal.status === 'approved' ? 'Approve' : 'Reject'} Correction Request`}
      >
        <form onSubmit={handleDecide} className="space-y-4">
          <FormField
            label="Decision Comment"
            required
            helperText="A comment is required for the audit record."
          >
            <textarea
              rows={3}
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              required
              placeholder="e.g. Approved as per manager request..."
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
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
              Confirm {decisionModal.status === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
