import { Router } from 'express';
import { authenticate, mustChangePasswordGuard, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createAnnouncementSchema } from './comms.schema.js';
import * as ctrl from './comms.controller.js';

const router = Router();

router.use(authenticate, mustChangePasswordGuard);

// Announcements
// GET /api/announcements — View company announcements (all roles)
router.get('/announcements', ctrl.listAnnouncements);

// POST /api/announcements — Post announcement (Admin & HR only)
router.post(
  '/announcements',
  requireRole(['admin', 'hr']),
  validate(createAnnouncementSchema),
  ctrl.createAnnouncement
);

// In-app Notifications
// GET /api/notifications — My in-app notifications
router.get('/notifications', ctrl.getUserNotifications);

// POST /api/notifications/:id/read — Mark single notification as read
router.post('/notifications/:id/read', ctrl.markNotificationAsRead);

// POST /api/notifications/read-all — Mark all as read
router.post('/notifications/read-all', ctrl.markAllNotificationsAsRead);

export const commsRoutes = router;
