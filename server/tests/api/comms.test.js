import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as commsService from '../../src/modules/comms/comms.service.js';
import * as auditService from '../../src/modules/audit/audit.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 7: Comms & Audit API Tests (T7.1, T7.2, T7.3)', () => {
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

  describe('Announcements (T7.1)', () => {
    it('HR/Admin can post an announcement', async () => {
      vi.spyOn(commsService, 'createAnnouncement').mockResolvedValueOnce({
        _id: 'ann_1',
        title: 'Office Closed on Monday',
        body: 'Public holiday celebration',
        priority: 'normal'
      });

      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({
          title: 'Office Closed on Monday',
          body: 'Public holiday celebration',
          priority: 'normal'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Office Closed on Monday');
    });

    it('Employee cannot post announcements (403)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({
          title: 'Not Allowed',
          body: 'Trying to post'
        });

      expect(res.status).toBe(403);
    });

    it('All employees can read announcements', async () => {
      vi.spyOn(commsService, 'listAnnouncements').mockResolvedValueOnce([
        { _id: 'ann_1', title: 'Office Closed on Monday' }
      ]);

      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('In-app Notifications (T7.2)', () => {
    it('Employee can fetch their notifications with unread count', async () => {
      vi.spyOn(commsService, 'getUserNotifications').mockResolvedValueOnce({
        items: [
          {
            _id: 'notif_1',
            type: 'leave_decision',
            title: 'Leave Request APPROVED',
            body: 'Your leave request was approved'
          }
        ],
        unreadCount: 1
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('User can mark a notification as read', async () => {
      vi.spyOn(commsService, 'markNotificationAsRead').mockResolvedValueOnce({
        _id: 'notif_1',
        readAt: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/notifications/notif_1/read')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readAt).toBeDefined();
    });
  });

  describe('Audit Log (T7.3)', () => {
    it('Admin can view audit log with filters and pagination', async () => {
      vi.spyOn(auditService, 'getAuditLogs').mockResolvedValueOnce({
        items: [
          {
            _id: 'audit_1',
            action: 'finalize',
            entity: 'payroll_run',
            actorRole: 'admin',
            at: new Date().toISOString()
          }
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
      });

      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].entity).toBe('payroll_run');
    });

    it('HR cannot view audit log (403)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${mockHrToken}`);

      expect(res.status).toBe(403);
    });

    it('Employee cannot view audit log (403)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${mockEmployeeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
