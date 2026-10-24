import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as setupService from '../../src/modules/setup/setup.service.js';
import * as authService from '../../src/modules/auth/auth.service.js';
import * as orgService from '../../src/modules/org/org.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 1: Auth & Setup Integration Tests (T1.8)', () => {
  const app = createApp();

  const mockAdminToken = jwt.sign(
    { userId: 'admin_123', role: 'admin', employeeId: null, mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockHrToken = jwt.sign(
    { userId: 'hr_123', role: 'hr', employeeId: 'emp_123', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockForcedChangeToken = jwt.sign(
    { userId: 'user_force', role: 'employee', employeeId: 'emp_force', mustChangePassword: true },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('First-run Setup (F01)', () => {
    it('GET /api/setup/status returns status from service', async () => {
      vi.spyOn(setupService, 'getSetupStatus').mockResolvedValueOnce({ setupComplete: false });
      const res = await request(app).get('/api/setup/status');
      expect(res.status).toBe(200);
      expect(res.body.data.setupComplete).toBe(false);
    });

    it('POST /api/setup performs setup successfully', async () => {
      vi.spyOn(setupService, 'performSetup').mockResolvedValueOnce({
        companyName: 'Acme Corp',
        adminEmail: 'admin@acme.com',
        setupComplete: true
      });

      const res = await request(app).post('/api/setup').send({
        companyName: 'Acme Corp',
        adminEmail: 'admin@acme.com',
        adminPassword: 'Password123!'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.setupComplete).toBe(true);
      expect(res.body.data.adminEmail).toBe('admin@acme.com');
    });
  });

  describe('Auth & Login (F02)', () => {
    it('POST /api/auth/login logs in user and returns token', async () => {
      vi.spyOn(authService, 'loginUser').mockResolvedValueOnce({
        token: mockAdminToken,
        user: { id: 'admin_123', email: 'admin@acme.com', role: 'admin', mustChangePassword: false }
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@acme.com',
        password: 'Password123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('admin');
    });

    it('GET /api/auth/me returns current user profile', async () => {
      vi.spyOn(authService, 'getUserProfile').mockResolvedValueOnce({
        _id: 'admin_123',
        email: 'admin@acme.com',
        role: 'admin'
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@acme.com');
    });

    it('blocks general routes when mustChangePassword=true with 403 PASSWORD_CHANGE_REQUIRED', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${mockForcedChangeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });
  });

  describe('RBAC & Organization Settings (F03, F04)', () => {
    it('GET /api/settings allows Admin and HR', async () => {
      vi.spyOn(orgService, 'getSettings').mockResolvedValueOnce({
        companyName: 'Acme Corp',
        officeStart: '09:00',
        graceMinutes: 15
      });

      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.companyName).toBe('Acme Corp');
    });

    it('PUT /api/settings is forbidden for HR (403)', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ graceMinutes: 20 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
