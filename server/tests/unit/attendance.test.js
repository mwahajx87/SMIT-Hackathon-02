import { describe, it, expect } from 'vitest';
import { isCheckInLate, calculateAttendanceStatus } from '../../src/modules/attendance/status.js';

describe('Attendance Rules & Status Calculation (T3.1, T3.6)', () => {
  describe('Late Check-in Boundary (09:15:00 vs 09:15:01)', () => {
    it('09:15:00 in Asia/Karachi (04:15:00 UTC) is ON TIME', () => {
      const onTime = new Date('2026-10-25T04:15:00Z');
      expect(isCheckInLate(onTime, '09:00', 15, 'Asia/Karachi')).toBe(false);
    });

    it('09:15:01 in Asia/Karachi (04:15:01 UTC) is LATE', () => {
      const late = new Date('2026-10-25T04:15:01Z');
      expect(isCheckInLate(late, '09:00', 15, 'Asia/Karachi')).toBe(true);
    });
  });

  describe('Half-day duration threshold (Under 5 hours)', () => {
    it('worked 4 hours 59 minutes is half_day', () => {
      const checkIn = new Date('2026-10-25T04:00:00Z'); // 09:00 local
      const checkOut = new Date('2026-10-25T08:59:00Z'); // 13:59 local (299 minutes)
      const res = calculateAttendanceStatus({
        checkInAt: checkIn,
        checkOutAt: checkOut,
        officeStart: '09:00',
        graceMinutes: 15,
        halfDayHours: 5,
        timezone: 'Asia/Karachi'
      });

      expect(res.status).toBe('half_day');
      expect(res.workedMinutes).toBe(299);
    });

    it('worked 5 hours or more is present', () => {
      const checkIn = new Date('2026-10-25T04:00:00Z'); // 09:00 local
      const checkOut = new Date('2026-10-25T09:00:00Z'); // 14:00 local (300 minutes)
      const res = calculateAttendanceStatus({
        checkInAt: checkIn,
        checkOutAt: checkOut,
        officeStart: '09:00',
        graceMinutes: 15,
        halfDayHours: 5,
        timezone: 'Asia/Karachi'
      });

      expect(res.status).toBe('present');
      expect(res.workedMinutes).toBe(300);
    });
  });
});
