import { Router } from 'express';
import { authenticate, mustChangePasswordGuard, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { applyLeaveSchema, decideLeaveSchema, leaveListQuerySchema } from './leave.schema.js';
import * as ctrl from './leave.controller.js';

const router = Router();

// All leave routes require authentication
router.use(authenticate, mustChangePasswordGuard);

// POST /leave — Apply for leave (any role with an employee link)
router.post('/', validate(applyLeaveSchema), ctrl.applyLeave);

// POST /leave/:id/cancel — Cancel own pending leave
router.post('/:id/cancel', ctrl.cancelLeave);

// GET /leave/balance — Own leave balances
router.get('/balance', ctrl.getBalance);

// GET /leave — List leave requests (own for employee, all for HR/Admin)
router.get('/', validate(leaveListQuerySchema, 'query'), ctrl.listLeave);

// GET /leave/inbox — Pending requests for HR/Admin to decide
router.get('/inbox', requireRole(['admin', 'hr']), ctrl.getLeaveInbox);

// POST /leave/:id/decide — Approve/reject (HR/Admin only)
router.post(
  '/:id/decide',
  requireRole(['admin', 'hr']),
  validate(decideLeaveSchema),
  ctrl.decideLeave
);

export const leaveRoutes = router;
