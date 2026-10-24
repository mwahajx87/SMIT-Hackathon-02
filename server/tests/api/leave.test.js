import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as leaveService from '../../src/modules/leave/leave.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';
import { AppError } from '../../src/shared/errors.js';

describe('Phase 4: Leave API Tests (T4.4)', () => {
  const app = createApp();

  const mockEmployeeToken = jwt.sign(
    { userId: 'u_emp1', role: 'employee', employeeId: 'emp_123', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockHrToken = jwt.sign(
    { userId: 'u_hr', role: 'hr', employeeId: 'emp_hr', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockAdminToken = jwt.sign(
    { userId: 'u_admin', role: 'admin', employeeId: null, mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('POST /api/leave — Apply for leave (T4.1)', () => {
    it('creates a leave request successfully', async () => {
      vi.spyOn(leaveService, 'applyLeave').mockResolvedValueOnce({
        _id: 'leave_1',
        employeeId: 'emp_123',
        leaveType: 'annual',
        startDate: '2026-11-02',
        endDate: '2026-11-06',
        workingDays: 5,
        reason: 'Vacation',
        status: 'pending'
      });

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          leaveType: 'annual',
          startDate: '2026-11-02',
          endDate: '2026-11-06',
          reason: 'Vacation'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.leaveType).toBe('annual');
      expect(res.body.data.workingDays).toBe(5);
    });

    it('overlap returns 422', async () => {
      vi.spyOn(leaveService, 'applyLeave').mockRejectedValueOnce(
        new AppError('LEAVE_OVERLAP', 422, 'Leave request overlaps.')
      );

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          leaveType: 'annual',
          startDate: '2026-11-03',
          endDate: '2026-11-05',
          reason: 'Same range'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('LEAVE_OVERLAP');
    });

    it('over-balance returns 422 INSUFFICIENT_BALANCE', async () => {
      vi.spyOn(leaveService, 'applyLeave').mockRejectedValueOnce(
        new AppError('INSUFFICIENT_BALANCE', 422, 'Insufficient annual balance.')
      );

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          leaveType: 'annual',
          startDate: '2026-12-01',
          endDate: '2026-12-31',
          reason: 'Too many days'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('unpaid leave is unlimited (service does not throw on large requests)', async () => {
      vi.spyOn(leaveService, 'applyLeave').mockResolvedValueOnce({
        _id: 'leave_2',
        employeeId: 'emp_123',
        leaveType: 'unpaid',
        startDate: '2026-11-02',
        endDate: '2026-12-31',
        workingDays: 44,
        reason: 'Extended unpaid',
        status: 'pending'
      });

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          leaveType: 'unpaid',
          startDate: '2026-11-02',
          endDate: '2026-12-31',
          reason: 'Extended unpaid'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.leaveType).toBe('unpaid');
      expect(res.body.data.workingDays).toBe(44);
    });

    it('rejects invalid schema (missing reason)', async () => {
      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          leaveType: 'annual',
          startDate: '2026-11-02',
          endDate: '2026-11-06'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/leave/:id/cancel (T4.1)', () => {
    it('cancels own pending request', async () => {
      vi.spyOn(leaveService, 'cancelLeave').mockResolvedValueOnce({
        _id: 'leave_1',
        status: 'cancelled'
      });

      const res = await request(app)
        .post('/api/leave/leave_1/cancel')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('cannot cancel non-pending request', async () => {
      vi.spyOn(leaveService, 'cancelLeave').mockRejectedValueOnce(
        new AppError('CANNOT_CANCEL', 400, 'Cannot cancel an approved request.')
      );

      const res = await request(app)
        .post('/api/leave/leave_1/cancel')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CANCEL');
    });
  });

  describe('GET /api/leave/balance (T4.2)', () => {
    it('returns leave balances', async () => {
      vi.spyOn(leaveService, 'getAllBalances').mockResolvedValueOnce([
        { leaveType: 'annual', name: 'Annual Leave', quota: 14, approved: 3, pending: 1, used: 4, available: 10, isPaid: true },
        { leaveType: 'sick', name: 'Sick Leave', quota: 8, approved: 0, pending: 0, used: 0, available: 8, isPaid: true },
        { leaveType: 'casual', name: 'Casual Leave', quota: 10, approved: 2, pending: 0, used: 2, available: 8, isPaid: true },
        { leaveType: 'unpaid', name: 'Unpaid Leave', quota: null, approved: 0, pending: 0, used: 0, available: null, isPaid: false }
      ]);

      const res = await request(app)
        .get('/api/leave/balance')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data[0].available).toBe(10);
      // Unpaid has null available (unlimited)
      expect(res.body.data[3].available).toBeNull();
    });
  });

  describe('GET /api/leave (T4.2)', () => {
    it('lists leave requests', async () => {
      vi.spyOn(leaveService, 'listLeaveRequests').mockResolvedValueOnce({
        items: [{ _id: 'leave_1', leaveType: 'annual', status: 'pending' }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
      });

      const res = await request(app)
        .get('/api/leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe('GET /api/leave/inbox (T4.2)', () => {
    it('HR can access inbox', async () => {
      vi.spyOn(leaveService, 'getLeaveInbox').mockResolvedValueOnce({
        items: [{ _id: 'leave_1', status: 'pending' }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
      });

      const res = await request(app)
        .get('/api/leave/inbox')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('Employee cannot access inbox', async () => {
      const res = await request(app)
        .get('/api/leave/inbox')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/leave/:id/decide (T4.3)', () => {
    it('HR can approve a leave request', async () => {
      vi.spyOn(leaveService, 'decideLeave').mockResolvedValueOnce({
        _id: 'leave_1',
        status: 'approved',
        decisionComment: 'Approved, enjoy!',
        decidedBy: 'u_hr'
      });

      const res = await request(app)
        .post('/api/leave/leave_1/decide')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ status: 'approved', decisionComment: 'Approved, enjoy!' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('HR cannot approve own leave (self-approval blocked)', async () => {
      vi.spyOn(leaveService, 'decideLeave').mockRejectedValueOnce(
        new AppError('FORBIDDEN', 403, 'You cannot approve your own leave request.')
      );

      const res = await request(app)
        .post('/api/leave/leave_hr/decide')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ status: 'approved', decisionComment: 'Self approve' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Employee cannot decide on leave', async () => {
      const res = await request(app)
        .post('/api/leave/leave_1/decide')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ status: 'approved', decisionComment: 'Trying to approve' });

      expect(res.status).toBe(403);
    });

    it('Admin can approve HR leave', async () => {
      vi.spyOn(leaveService, 'decideLeave').mockResolvedValueOnce({
        _id: 'leave_hr',
        status: 'approved',
        decisionComment: 'Admin approved',
        decidedBy: 'u_admin'
      });

      const res = await request(app)
        .post('/api/leave/leave_hr/decide')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ status: 'approved', decisionComment: 'Admin approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('requires comment for decision', async () => {
      const res = await request(app)
        .post('/api/leave/leave_1/decide')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(400);
    });
  });
});
