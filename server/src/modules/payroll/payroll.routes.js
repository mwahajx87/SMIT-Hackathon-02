import { Router } from 'express';
import { authenticate, mustChangePasswordGuard, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createPayrollRunSchema, payrollListQuerySchema } from './payroll.schema.js';
import * as ctrl from './payroll.controller.js';

const router = Router();

// All payroll routes require authentication & password change completion
router.use(authenticate, mustChangePasswordGuard);

// Payslip endpoints
// GET /api/payslips — Employee or HR/Admin view payslips
router.get('/payslips', ctrl.getEmployeePayslips);

// GET /api/payslips/:runId/:employeeId/pdf — Download PDF payslip
router.get('/payslips/:runId/:employeeId/pdf', ctrl.downloadPayslipPdf);

// Payroll Run endpoints (HR & Admin only)
// POST /api/payroll/runs — Create draft run for month (HR / Admin)
router.post(
  '/payroll/runs',
  requireRole(['admin', 'hr']),
  validate(createPayrollRunSchema),
  ctrl.createPayrollRun
);

// GET /api/payroll/runs — List payroll runs (HR / Admin)
router.get(
  '/payroll/runs',
  requireRole(['admin', 'hr']),
  validate(payrollListQuerySchema, 'query'),
  ctrl.listPayrollRuns
);

// GET /api/payroll/runs/:id — Details of a payroll run (HR / Admin)
router.get(
  '/payroll/runs/:id',
  requireRole(['admin', 'hr']),
  ctrl.getPayrollRunById
);

// POST /api/payroll/runs/:id/regenerate — Regenerate draft run (HR / Admin)
router.post(
  '/payroll/runs/:id/regenerate',
  requireRole(['admin', 'hr']),
  ctrl.regeneratePayrollRun
);

// POST /api/payroll/runs/:id/finalize — Finalize payroll run (Admin ONLY)
router.post(
  '/payroll/runs/:id/finalize',
  requireRole(['admin']),
  ctrl.finalizePayrollRun
);

export const payrollRoutes = router;
