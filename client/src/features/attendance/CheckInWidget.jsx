import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Clock, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { CameraCheckInModal } from './CameraCheckInModal.jsx';

export function CheckInWidget({ onStatusChange }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadToday = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/attendance/today');
      setRecord(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const data = await apiRequest('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ source: 'web' })
      });
      setRecord(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      setErrorMsg(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const data = await apiRequest('/attendance/check-out', {
        method: 'POST'
      });
      setRecord(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      setErrorMsg(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const [showCamera, setShowCamera] = useState(false);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-28 rounded-xl" />;
  }

  const isCheckedIn = Boolean(record?.checkInAt);
  const isCheckedOut = Boolean(record?.checkOutAt);

  return (
    <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#12A087]" />
          <h3 className="font-semibold text-sm text-[#1F2A44]">Today&apos;s Attendance</h3>
        </div>
        {isCheckedIn && (
          <StatusBadge status={record.status} />
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-[#D64545]/10 border border-[#D64545]/20 rounded-lg text-xs text-[#D64545] font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* State display */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs flex justify-around text-center">
        <div>
          <span className="text-[#6B7385] block">Check-in</span>
          <span className="font-semibold text-[#1F2A44] font-mono text-sm">
            {isCheckedIn
              ? new Date(record.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </span>
        </div>
        <div className="border-r border-gray-200" />
        <div>
          <span className="text-[#6B7385] block">Check-out</span>
          <span className="font-semibold text-[#1F2A44] font-mono text-sm">
            {isCheckedOut
              ? new Date(record.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </span>
        </div>
      </div>

      {/* Non-working day notification */}
      {isCheckedIn && !record.isWorkingDay && (
        <p className="text-[11px] text-[#E9962B] bg-[#E9962B]/10 p-2 rounded text-center">
          Non-working day — your attendance is recorded but excluded from attendance rate metrics.
        </p>
      )}

      {/* Actions */}
      <div>
        {!isCheckedIn ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCheckIn} loading={actionLoading} className="flex-1">
              Web Check-in
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCamera(true)}
              className="flex items-center justify-center gap-1.5 border-[#12A087] text-[#12A087] hover:bg-[#12A087]/5"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </Button>
          </div>
        ) : !isCheckedOut ? (
          <Button onClick={handleCheckOut} loading={actionLoading} variant="secondary" className="w-full">
            Check-out
          </Button>
        ) : (
          <div className="p-2 bg-[#2E9E5B]/10 text-[#2E9E5B] rounded-lg text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Attendance completed for today</span>
          </div>
        )}
      </div>

      {/* Camera Check In Modal (Phase 10 T10.1) */}
      <CameraCheckInModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onSuccess={(data) => {
          setRecord(data);
          if (onStatusChange) onStatusChange(data);
        }}
      />
    </div>
  );
}
