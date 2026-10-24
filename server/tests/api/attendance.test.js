import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as attService from '../../src/modules/attendance/attendance.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 3: Attendance API Tests (T3.6)', () => {
  const app = createApp();

  const mockEmployeeToken = jwt.sign(
    { userId: 'u_emp1', role: 'employee', employeeId: 'emp_123', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockHrToken = jwt.sign(
    { userId: 'u_hr', role: 'hr', employeeId: 'emp_hr', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('Check-in & Check-out (F09)', () => {
    it('POST /api/attendance/check-in records attendance', async () => {
      vi.spyOn(attService, 'checkIn').mockResolvedValueOnce({
        _id: 'att_1',
        employeeId: 'emp_123',
        date: '2026-10-25',
        checkInAt: new Date().toISOString(),
        status: 'present',
        isWorkingDay: false
      });

      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ source: 'web' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('present');
    });

    it('Duplicate check-in on the same day returns 409', async () => {
      const AppError = (await import('../../src/shared/errors.js')).AppError;
      vi.spyOn(attService, 'checkIn').mockRejectedValueOnce(
        new AppError('ALREADY_CHECKED_IN', 409, 'You have already checked in for today.')
      );

      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ source: 'web' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
    });

    it('POST /api/attendance/check-out updates checkout time and worked minutes', async () => {
      vi.spyOn(attService, 'checkOut').mockResolvedValueOnce({
        _id: 'att_1',
        employeeId: 'emp_123',
        date: '2026-10-25',
        checkInAt: new Date(Date.now() - 360 * 60000).toISOString(),
        checkOutAt: new Date().toISOString(),
        status: 'present',
        workedMinutes: 360
      });

      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workedMinutes).toBe(360);
    });
  });

  describe('Attendance Board (F10)', () => {
    it('GET /api/attendance/board returns summary chips and employee list for HR', async () => {
      vi.spyOn(attService, 'getAttendanceBoard').mockResolvedValueOnce({
        date: '2026-10-25',
        summary: { total: 2, present: 1, late: 1, halfDay: 0, notCheckedIn: 0 },
        items: []
      });

      const res = await request(app)
        .get('/api/attendance/board?date=2026-10-25')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.total).toBe(2);
    });
  });

  describe('Corrections & Self-Approval Prevention (F11)', () => {
    it('HR cannot approve their own correction request (403)', async () => {
      const AppError = (await import('../../src/shared/errors.js')).AppError;
      vi.spyOn(attService, 'decideCorrection').mockRejectedValueOnce(
        new AppError('FORBIDDEN', 403, 'You cannot approve your own attendance correction. An Admin must decide.')
      );

      const res = await request(app)
        .post('/api/attendance/corrections/corr_1/decide')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ status: 'approved', decisionComment: 'Self approval attempt' });

      expect(res.status).toBe(403);
    });
  });
});
