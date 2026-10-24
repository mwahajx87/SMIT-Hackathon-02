import { Router } from 'express';
import * as orgController from './org.controller.js';
import {
  updateSettingsSchema,
  departmentSchema,
  designationSchema,
  leaveTypeSchema,
  holidaySchema
} from './org.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

// Settings
router.get('/settings', authenticate, mustChangePasswordGuard, requireRole(['admin', 'hr']), orgController.getSettings);
router.put('/settings', authenticate, mustChangePasswordGuard, requireRole(['admin']), validate(updateSettingsSchema), orgController.updateSettings);

// Departments
router.get('/departments', authenticate, mustChangePasswordGuard, requireRole(['admin', 'hr']), orgController.getDepartments);
router.post('/departments', authenticate, mustChangePasswordGuard, requireRole(['admin']), validate(departmentSchema), orgController.createDepartment);
router.delete('/departments/:id', authenticate, mustChangePasswordGuard, requireRole(['admin']), orgController.deleteDepartment);

// Designations
router.get('/designations', authenticate, mustChangePasswordGuard, requireRole(['admin', 'hr']), orgController.getDesignations);
router.post('/designations', authenticate, mustChangePasswordGuard, requireRole(['admin']), validate(designationSchema), orgController.createDesignation);
router.delete('/designations/:id', authenticate, mustChangePasswordGuard, requireRole(['admin']), orgController.deleteDesignation);

// Leave Types
router.get('/leave-types', authenticate, mustChangePasswordGuard, requireRole(['admin', 'hr', 'employee']), orgController.getLeaveTypes);
router.post('/leave-types', authenticate, mustChangePasswordGuard, requireRole(['admin']), validate(leaveTypeSchema), orgController.createLeaveType);

// Holidays
router.get('/holidays', authenticate, mustChangePasswordGuard, requireRole(['admin', 'hr', 'employee']), orgController.getHolidays);
router.post('/holidays', authenticate, mustChangePasswordGuard, requireRole(['admin']), validate(holidaySchema), orgController.createHoliday);
router.delete('/holidays/:id', authenticate, mustChangePasswordGuard, requireRole(['admin']), orgController.deleteHoliday);

export const orgRoutes = router;
