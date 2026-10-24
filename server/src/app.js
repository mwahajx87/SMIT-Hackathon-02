import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { setupRoutes } from './modules/setup/setup.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { orgRoutes } from './modules/org/org.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';

import { employeeRoutes } from './modules/employees/employee.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { leaveRoutes } from './modules/leave/leave.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { commsRoutes } from './modules/comms/comms.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';

export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors({
    origin: env.CLIENT_URL ? env.CLIENT_URL.split(',') : '*',
    credentials: true
  }));
  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      data: {
        status: 'ok',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Module routes
  app.use('/api/setup', setupRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', orgRoutes); // /settings, /departments, etc.
  app.use('/api/users', userRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api', employeeRoutes); // /employees, /me/profile
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api', payrollRoutes); // /payroll/runs, /payslips
  app.use('/api/dashboard', analyticsRoutes);
  app.use('/api', commsRoutes); // /announcements, /notifications
  app.use('/api/ai', aiRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
}
