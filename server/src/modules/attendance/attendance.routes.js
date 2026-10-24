import { Router } from 'express';
import * as attController from './attendance.controller.js';
import {
  checkInSchema,
  requestCorrectionSchema,
  decideCorrectionSchema
} from './attendance.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

// Employee & HR web check-in & check-out
router.post(
  '/check-in',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['employee', 'hr']),
  validate(checkInSchema),
  attController.checkIn
);

router.post(
  '/check-out',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['employee', 'hr']),
  attController.checkOut
);

router.get(
  '/today',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['employee', 'hr']),
  attController.getToday
);

// Attendance calendar (scoped: Employee reads own, HR/Admin can query any)
router.get(
  '/calendar',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr', 'employee']),
  attController.getCalendar
);

// Attendance Board (HR and Admin)
router.get(
  '/board',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr']),
  attController.getBoard
);

// Attendance Corrections
router.post(
  '/corrections',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['employee', 'hr']),
  validate(requestCorrectionSchema),
  attController.requestCorrection
);

router.get(
  '/corrections',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr', 'employee']),
  attController.listCorrections
);

// Decide correction (HR decides; Admin decides for HR's own)
router.post(
  '/corrections/:id/decide',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr']),
  validate(decideCorrectionSchema),
  attController.decideCorrection
);

export const attendanceRoutes = router;
