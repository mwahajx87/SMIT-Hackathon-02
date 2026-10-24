import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as analyticsService from '../../src/modules/analytics/analytics.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 6: Dashboard & Analytics Tests (T6.3)', () => {
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

  describe('GET /api/dashboard/admin (T6.2, T6.3)', () => {
    it('Admin can fetch admin dashboard metrics', async () => {
      vi.spyOn(analyticsService, 'getAdminDashboard').mockResolvedValueOnce({
        kpis: {
          headcount: 25,
          attritionRate: 4.0,
          attendanceRate: 96.5,
          payrollCost: 1500000
        },
        topLateComers: [{ employeeName: 'Alice', lateCount: 3 }]
      });

      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.headcount).toBe(25);
      expect(res.body.data.kpis.attendanceRate).toBe(96.5);
    });

    it('Employee cannot access admin dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(403);
    });

    it('HR cannot access admin dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/hr (T6.2)', () => {
    it('HR can fetch HR dashboard metrics', async () => {
      vi.spyOn(analyticsService, 'getHrDashboard').mockResolvedValueOnce({
        kpis: { headcount: 25, attendanceRate: 96.5, latePercentage: 12.0 },
        topLateComers: []
      });

      const res = await request(app)
        .get('/api/dashboard/hr')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.headcount).toBe(25);
    });

    it('Employee cannot access HR dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/dashboard/hr')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/employee (T6.2)', () => {
    it('Employee can fetch their personal self-service dashboard', async () => {
      vi.spyOn(analyticsService, 'getEmployeeDashboard').mockResolvedValueOnce({
        today: '2026-10-25',
        monthStats: { hoursWorked: 140, lateCount: 1 }
      });

      const res = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.monthStats.hoursWorked).toBe(140);
    });
  });
});
