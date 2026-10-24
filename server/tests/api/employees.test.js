import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as employeeService from '../../src/modules/employees/employee.service.js';
import * as csvService from '../../src/modules/employees/csv.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 2: Employees API & Scoping Tests (T2.6)', () => {
  const app = createApp();

  const mockHrToken = jwt.sign(
    { userId: 'hr_1', role: 'hr', employeeId: 'emp_hr', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockEmployeeToken = jwt.sign(
    { userId: 'emp_user_1', role: 'employee', employeeId: 'emp_1', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('Employee Registration & Listing (F06, F07)', () => {
    it('HR can register an employee and receives temp password', async () => {
      vi.spyOn(employeeService, 'createEmployee').mockResolvedValueOnce({
        employee: { _id: 'emp_new', code: 'EMP-0002', name: 'Ali Khan', email: 'ali@company.com' },
        tempPassword: 'Emp-temp-pass!'
      });

      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({
          name: 'Ali Khan',
          email: 'ali@company.com',
          departmentId: '507f1f77bcf86cd799439011',
          designationId: '507f1f77bcf86cd799439012',
          basicSalary: 75000,
          joinDate: '2026-10-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.employee.code).toBe('EMP-0002');
      expect(res.body.data).toHaveProperty('tempPassword');
    });

    it('Employee cannot create an employee (403)', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          name: 'Unauthorized Test',
          email: 'unauth@company.com',
          departmentId: '507f1f77bcf86cd799439011',
          designationId: '507f1f77bcf86cd799439012',
          basicSalary: 50000,
          joinDate: '2026-10-01'
        });

      expect(res.status).toBe(403);
    });

    it('Employee requesting another employee returns 404 (scope security)', async () => {
      const res = await request(app)
        .get('/api/employees/emp_other_person')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      // Critical requirement: must return 404 to avoid leaking existence
      expect(res.status).toBe(404);
    });
  });

  describe('Salary Access Control (F14)', () => {
    it('Employee cannot access salary endpoint (403)', async () => {
      const res = await request(app)
        .get('/api/employees/emp_1/salary')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(403);
    });

    it('HR can view salary breakdown (Basic, HRA, Medical, Gross)', async () => {
      vi.spyOn(employeeService, 'getEmployeeSalary').mockResolvedValueOnce({
        employeeId: 'emp_1',
        code: 'EMP-0001',
        name: 'Zainab Ahmed',
        basicSalary: 60000,
        hra: 24000,
        medical: 6000,
        gross: 90000
      });

      const res = await request(app)
        .get('/api/employees/emp_1/salary')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gross).toBe(90000);
    });
  });

  describe('CSV Import Dry Run (F08)', () => {
    it('POST /api/employees/import?dryRun=true reports row/field/reason errors', async () => {
      vi.spyOn(csvService, 'processCsvImport').mockResolvedValueOnce({
        dryRun: true,
        totalRows: 1,
        validCount: 0,
        errorCount: 1,
        errors: [{ row: 1, field: 'department', reason: "Unknown department 'Sales'" }],
        canCommit: false
      });

      const res = await request(app)
        .post('/api/employees/import?dryRun=true')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({
          rows: [{ name: 'Test', email: 'test@company.com', department: 'Sales', designation: 'Dev', basicSalary: 50000, joinDate: '2026-10-01' }]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dryRun).toBe(true);
      expect(res.body.data.errors[0].field).toBe('department');
    });
  });
});
