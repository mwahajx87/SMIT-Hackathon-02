import React, { useState } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function CorrectionModal({ isOpen, onClose, defaultDate, onSuccess }) {
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [requestedCheckIn, setRequestedCheckIn] = useState('09:00');
  const [requestedCheckOut, setRequestedCheckOut] = useState('17:00');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiRequest('/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify({
          date,
          requestedCheckIn,
          requestedCheckOut,
          reason
        })
      });
      alert('Correction request submitted for approval.');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit correction request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Attendance Correction">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#D64545]/10 text-[#D64545] rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        <FormField label="Date" required>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Requested Check-in">
            <input
              type="time"
              value={requestedCheckIn}
              onChange={(e) => setRequestedCheckIn(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
            />
          </FormField>

          <FormField label="Requested Check-out">
            <input
              type="time"
              value={requestedCheckOut}
              onChange={(e) => setRequestedCheckOut(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
            />
          </FormField>
        </div>

        <FormField label="Reason for Correction" required helperText="e.g. Forgot badge / System issue">
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Explain why a manual correction is required..."
            className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
