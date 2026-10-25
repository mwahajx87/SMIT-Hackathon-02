import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Camera } from 'lucide-react';
import { CameraCheckInModal } from './CameraCheckInModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function CheckInWidget({ onStatusChange }) {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCamera, setShowCamera] = useState(false);

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

  const todayDateFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 animate-pulse space-y-4">
        <div className="h-6 bg-[var(--bg)] rounded w-1/3"></div>
        <div className="h-4 bg-[var(--bg)] rounded w-1/4"></div>
        <div className="h-11 bg-[var(--bg)] rounded w-full mt-4"></div>
      </div>
    );
  }

  const isCheckedIn = Boolean(record?.checkInAt);
  const isCheckedOut = Boolean(record?.checkOutAt);

  const checkInTimeFormatted = isCheckedIn
    ? new Date(record.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const workedHoursText = record?.workHours
    ? `${Math.floor(record.workHours)} h ${Math.round((record.workHours % 1) * 60)} min`
    : '';

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 space-y-5 transition-colors">
      {/* Header with Greeting & Date */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)] leading-7">
          {getGreeting()}, {displayName}
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-4">
          {todayDateFormatted}
        </p>
      </div>

      {/* Non-working day notice */}
      {record && !record.isWorkingDay && (
        <div className="p-3 bg-[var(--info-soft)] border border-[var(--info)]/20 rounded-lg text-xs text-[var(--info)] font-normal leading-relaxed">
          Today is a non-working day. Your attendance is recorded but not counted in attendance rates.
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)] font-normal">
          {errorMsg}
        </div>
      )}

      {/* Attendance Status Display */}
      <div className="pt-1">
        {!isCheckedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">Not checked in yet</p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button 
                onClick={handleCheckIn} 
                loading={actionLoading} 
                size="lg"
                className="flex-1 text-sm font-medium h-11"
              >
                Check in
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setShowCamera(true)}
                title="Camera check-in"
                className="inline-flex items-center justify-center gap-1.5 h-11 px-4 text-xs"
              >
                <Camera className="w-4 h-4 stroke-[1.75]" />
                <span>Camera</span>
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Office hours start at 09:00</p>
          </div>
        ) : !isCheckedOut ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[var(--text)]">
                Checked in at <span className="tabular-nums font-semibold">{checkInTimeFormatted}</span>
              </p>
              {record.status && <StatusBadge status={record.status} />}
            </div>
            <Button 
              onClick={handleCheckOut} 
              loading={actionLoading} 
              variant="secondary" 
              size="lg"
              className="w-full text-sm font-medium h-11"
            >
              Check out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text)]">
              Worked <span className="tabular-nums font-semibold">{workedHoursText || 'today'}</span> today
            </p>
            <Button 
              disabled 
              variant="secondary" 
              size="lg"
              className="w-full text-sm font-medium h-11 opacity-60 cursor-not-allowed"
            >
              Attendance completed
            </Button>
          </div>
        )}
      </div>

      {/* Camera Check In Modal */}
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

