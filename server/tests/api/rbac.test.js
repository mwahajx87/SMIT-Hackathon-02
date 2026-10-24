import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 9: Comprehensive RBAC Matrix Sweep (T9.1)', () => {
  const app = createApp();

  const employeeToken = jwt.sign(
    { userId: 'u_emp', role: 'employee', employeeId: 'emp_001', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const hrToken = jwt.sign(
    { userId: 'u_hr', role: 'hr', employeeId: 'emp_hr', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const adminToken = jwt.sign(
    { userId: 'u_admin', role: 'admin', employeeId: null, mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const forcedPasswordToken = jwt.sign(
    { userId: 'u_new', role: 'employee', employeeId: 'emp_new', mustChangePassword: true },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('mustChangePassword Guardrail', () => {
    it('Blocks normal API requests with 403 PASSWORD_CHANGE_REQUIRED', async () => {
      const res = await request(app)
        .get('/api/leave/balance')
        .set('Authorization', `Bearer ${forcedPasswordToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('Allows password change endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${forcedPasswordToken}`)
        .send({ currentPassword: 'temp', newPassword: 'new' });

      // Not 403 password change required (will fail normal auth or validation)
      expect(res.status).not.toBe(403);
    });
  });

  describe('Settings & Company Configuration (Admin only)', () => {
    it('Employee cannot update settings (403)', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ graceMinutes: 20 });
      expect(res.status).toBe(403);
    });

    it('HR cannot update settings (403)', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ graceMinutes: 20 });
      expect(res.status).toBe(403);
    });
  });

  describe('Audit Log Access (Admin only)', () => {
    it('Employee cannot view audit log (403)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('HR cannot view audit log (403)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Payroll Finalization (Admin only)', () => {
    it('HR cannot finalize payroll run (403)', async () => {
      const res = await request(app)
        .post('/api/payroll/runs/run_test/finalize')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res.status).toBe(403);
    });

    it('Employee cannot finalize payroll run (403)', async () => {
      const res = await request(app)
        .post('/api/payroll/runs/run_test/finalize')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Executive Dashboard Access (Admin only for admin dashboard)', () => {
    it('Employee cannot view admin dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('HR cannot view admin dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('HR Dashboard Access (Admin and HR only)', () => {
    it('Employee cannot view HR dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/hr')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Attendance Board (Admin and HR only)', () => {
    it('Employee cannot view company attendance board (403)', async () => {
      const res = await request(app)
        .get('/api/attendance/board')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Announcements Posting (Admin and HR only)', () => {
    it('Employee cannot post announcements (403)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Notice', body: 'Body' });
      expect(res.status).toBe(403);
    });
  });

  describe('Leave Inbox (Admin and HR only)', () => {
    it('Employee cannot view leave inbox (403)', async () => {
      const res = await request(app)
        .get('/api/leave/inbox')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });
});
