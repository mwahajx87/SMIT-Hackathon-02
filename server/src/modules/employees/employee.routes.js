import { Router } from 'express';
import * as empController from './employee.controller.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateProfileSchema,
  updateSalarySchema
} from './employee.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

// Employee self-service profile
router.patch(
  '/me/profile',
  authenticate,
  mustChangePasswordGuard,
  validate(updateProfileSchema),
  empController.updateMyProfile
);

// Employees directory & search (Scoped: Employee reads own, HR/Admin reads all)
router.get(
  '/employees',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr', 'employee']),
  empController.listEmployees
);

// Employee 360 view (Scoped: Employee reads own, HR/Admin reads any)
router.get(
  '/employees/:id',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr', 'employee']),
  empController.getEmployeeById
);

// Create employee (HR only)
router.post(
  '/employees',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['hr']),
  validate(createEmployeeSchema),
  empController.createEmployee
);

// Update employee details (HR only)
router.patch(
  '/employees/:id',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['hr']),
  validate(updateEmployeeSchema),
  empController.updateEmployee
);

// Salary structure (HR write, Admin view)
router.get(
  '/employees/:id/salary',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['admin', 'hr']),
  empController.getSalary
);

router.put(
  '/employees/:id/salary',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['hr']),
  validate(updateSalarySchema),
  empController.updateSalary
);

// CSV Import & Export (HR only)
router.post(
  '/employees/import',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['hr']),
  empController.importCsv
);

router.get(
  '/employees/export',
  authenticate,
  mustChangePasswordGuard,
  requireRole(['hr']),
  empController.exportCsv
);

export const employeeRoutes = router;
