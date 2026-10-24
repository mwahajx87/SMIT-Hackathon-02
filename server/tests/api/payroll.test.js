import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as payrollService from '../../src/modules/payroll/payroll.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';
import { AppError } from '../../src/shared/errors.js';

describe('Phase 5: Payroll API Tests (T5.5)', () => {
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

  describe('Payroll Runs Creation & RBAC (T5.2)', () => {
    it('HR can create draft payroll run for a month', async () => {
      vi.spyOn(payrollService, 'createPayrollRun').mockResolvedValueOnce({
        _id: 'run_1',
        month: '2026-10',
        status: 'draft',
        totalEmployees: 10,
        totalNet: 800000
      });

      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ month: '2026-10' });

      expect(res.status).toBe(201);
      expect(res.body.data.month).toBe('2026-10');
      expect(res.body.data.status).toBe('draft');
    });

    it('Duplicate month run returns 409', async () => {
      vi.spyOn(payrollService, 'createPayrollRun').mockRejectedValueOnce(
        new AppError('RUN_ALREADY_EXISTS', 409, 'Run already exists for this month.')
      );

      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ month: '2026-10' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('RUN_ALREADY_EXISTS');
    });

    it('Employee cannot create payroll run (403)', async () => {
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ month: '2026-10' });

      expect(res.status).toBe(403);
    });
  });

  describe('Finalize and Locked State (T5.3, T5.5)', () => {
    it('HR CANNOT finalize payroll (403 forbidden)', async () => {
      const res = await request(app)
        .post('/api/payroll/runs/run_1/finalize')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(403);
    });

    it('Admin CAN finalize payroll run', async () => {
      vi.spyOn(payrollService, 'finalizePayrollRun').mockResolvedValueOnce({
        _id: 'run_1',
        month: '2026-10',
        status: 'finalized',
        finalizedAt: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/payroll/runs/run_1/finalize')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('finalized');
    });

    it('Finalized run CANNOT be modified or regenerated (409 locked)', async () => {
      vi.spyOn(payrollService, 'regeneratePayrollRun').mockRejectedValueOnce(
        new AppError('FINALIZED_RUN_LOCKED', 409, 'Finalized payroll runs are locked.')
      );

      const res = await request(app)
        .post('/api/payroll/runs/run_1/regenerate')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('FINALIZED_RUN_LOCKED');
    });
  });

  describe('Payslips Access & Scoping (T5.4, T5.5)', () => {
    it('Employee can fetch their own payslips', async () => {
      vi.spyOn(payrollService, 'getEmployeePayslips').mockResolvedValueOnce([
        {
          runId: 'run_1',
          month: '2026-10',
          payslip: { netSalary: 79818.18, basicSalary: 60000 }
        }
      ]);

      const res = await request(app)
        .get('/api/payslips')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].payslip.netSalary).toBe(79818.18);
    });

    it('Employee fetching another employee single payslip returns 404 (not 403 to prevent leak)', async () => {
      vi.spyOn(payrollService, 'getSinglePayslip').mockRejectedValueOnce(
        new AppError('NOT_FOUND', 404, 'Payslip not found.')
      );

      const res = await request(app)
        .get('/api/payslips/run_1/emp_other/pdf')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(404);
    });
  });
});
