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

  // CORS must come BEFORE helmet so preflight OPTIONS responses
  // are not stripped of Access-Control headers
  const allowedOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(',').map((o) => o.trim())
    : [];

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // If an explicit allow-list is configured, enforce it
      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
      }
      // No allow-list → open API, permit every origin
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  // Respond immediately to every OPTIONS preflight before any other middleware
  app.options('*', cors(corsOptions));

  // Security headers (after CORS so they don't strip CORS headers)
  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));

  // Root & Health endpoints
  app.get('/', (req, res) => {
    res.json({
      name: 'HCM Lite Backend API',
      status: 'active',
      endpoints: {
        health: '/api/health',
        setupStatus: '/api/setup/status'
      }
    });
  });

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
