import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { CorrectionModal } from './CorrectionModal.jsx';
import { Calendar, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

export function MyAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [att, corr] = await Promise.all([
        apiRequest(`/attendance/calendar?month=${currentMonth}`),
        apiRequest('/attendance/corrections')
      ]);
      setRecords(att || []);
      setCorrections(corr || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 2, 1));
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(Date.UTC(year, month, 1));
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F2A44]">My Attendance</h1>
          <p className="text-xs text-[#6B7385] mt-1">
            View your monthly check-in history, hours worked, and track correction requests.
          </p>
        </div>
        <Button onClick={() => setIsCorrectionOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Request Correction
        </Button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E3E7EE]">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#12A087]" />
          <span className="font-semibold text-[#1F2A44]">{currentMonth}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Attendance History List */}
      <Card title="Attendance Records for Month">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B7385]">Loading attendance...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7385]">
            No attendance records recorded for this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E3E7EE] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-[#6B7385]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Check-out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7EE] text-[#1F2A44]">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{r.date}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.checkOutAt
                        ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.workedMinutes ? `${Math.floor(r.workedMinutes / 60)}h ${r.workedMinutes % 60}m` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7385] capitalize">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Corrections Requests Section */}
      <Card title="My Correction Requests">
        {corrections.length === 0 ? (
          <p className="text-xs text-[#6B7385]">No correction requests submitted.</p>
        ) : (
          <div className="divide-y divide-[#E3E7EE]">
            {corrections.map((c) => (
              <div key={c._id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-sm text-[#1F2A44] mr-2">{c.date}</span>
                  <span className="text-[#6B7385]">
                    Times: {c.requestedCheckIn || '--:--'} to {c.requestedCheckOut || '--:--'}
                  </span>
                  <p className="text-[#6B7385] mt-0.5">Reason: {c.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  {c.decisionComment && (
                    <span className="text-gray-400 italic">"{c.decisionComment}"</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
