import { Router } from 'express';
import { authenticate, mustChangePasswordGuard, requireRole } from '../../middleware/auth.js';
import * as ctrl from './analytics.controller.js';

const router = Router();

router.use(authenticate, mustChangePasswordGuard);

// GET /api/dashboard/admin — Admin Dashboard (Admin only)
router.get('/admin', requireRole(['admin']), ctrl.getAdminDashboard);

// GET /api/dashboard/hr — HR Dashboard (Admin & HR)
router.get('/hr', requireRole(['admin', 'hr']), ctrl.getHrDashboard);

// GET /api/dashboard/employee — Employee Dashboard (strictly scoped to self)
router.get('/employee', ctrl.getEmployeeDashboard);

// T10.3 Absence anomaly flags & Attrition risk (Admin & HR)
router.get('/anomalies', requireRole(['admin', 'hr']), ctrl.getAnomalies);
router.get('/attrition-risk', requireRole(['admin', 'hr']), ctrl.getAttritionRisk);

export const analyticsRoutes = router;
