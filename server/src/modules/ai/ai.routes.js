import { Router } from 'express';
import { authenticate, mustChangePasswordGuard, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './ai.controller.js';

const router = Router();

router.use(authenticate, mustChangePasswordGuard);

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000)
});

const summarySchema = z.object({
  kpis: z.record(z.any())
});

const smartLeaveSchema = z.object({
  text: z.string().min(1, 'Text is required').max(500)
});

// POST /api/ai/chat — Chat assistant (all authenticated roles)
router.post('/chat', validate(chatSchema), ctrl.chat);

// POST /api/ai/summary — KPI executive summary (Admin & HR)
router.post('/summary', requireRole(['admin', 'hr']), validate(summarySchema), ctrl.generateSummary);

// POST /api/ai/smart-leave — Natural language leave parser (all roles)
router.post('/smart-leave', validate(smartLeaveSchema), ctrl.smartLeave);

export const aiRoutes = router;
