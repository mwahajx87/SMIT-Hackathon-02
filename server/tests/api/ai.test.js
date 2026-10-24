import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as aiService from '../../src/modules/ai/ai.service.js';
import * as aiTools from '../../src/modules/ai/ai.tools.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

describe('Phase 8: AI Assistant API & Guardrail Tests (T8.6)', () => {
  const app = createApp();

  const mockEmployeeToken = jwt.sign(
    { userId: 'u_emp1', role: 'employee', employeeId: 'emp_123', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  const mockHrToken = jwt.sign(
    { userId: 'u_hr', role: 'hr', employeeId: 'emp_hr', mustChangePassword: false },
    env.JWT_SECRET || 'test_jwt_secret_key_1234567890'
  );

  describe('POST /api/ai/chat (T8.3)', () => {
    it('returns answer with AI-generated label', async () => {
      vi.spyOn(aiService, 'chat').mockResolvedValueOnce({
        answer: 'Office start time is 09:00 with a 15-minute grace period.',
        label: 'AI-generated',
        toolCalls: []
      });

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ message: 'What is the office start policy?' });

      expect(res.status).toBe(200);
      expect(res.body.data.label).toBe('AI-generated');
      expect(res.body.data.answer).toContain('09:00');
    });

    it('rejects empty message', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ message: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('Security & Scope Guardrails in AI Tools (T8.2)', () => {
    it('Employee asking for headcount is denied by tool handler', async () => {
      const result = await aiTools.getHeadcountTool({}, { role: 'employee', employeeId: 'emp_123' });
      expect(result.error).toContain('Access denied');
    });

    it('Employee asking for late-comers is denied by tool handler', async () => {
      const result = await aiTools.getLateComersTool({}, { role: 'employee', employeeId: 'emp_123' });
      expect(result.error).toContain('Access denied');
    });

    it('HR can view headcount via tool', async () => {
      const analyticsService = await import('../../src/modules/analytics/analytics.service.js');
      vi.spyOn(analyticsService, 'getHeadcountMetric').mockResolvedValueOnce(25);
      const result = await aiTools.getHeadcountTool({}, { role: 'hr', employeeId: 'emp_hr' });
      expect(result).toHaveProperty('headcount', 25);
    });
  });

  describe('POST /api/ai/summary (T8.4)', () => {
    it('HR can request dashboard summary', async () => {
      vi.spyOn(aiService, 'generateSummary').mockResolvedValueOnce({
        summary: '• Headcount is 25 employees.\n• Attendance rate is 96.5%.\n• Monthly payroll cost is PKR 1.5M.',
        label: 'AI-generated'
      });

      const res = await request(app)
        .post('/api/ai/summary')
        .set('Authorization', `Bearer ${mockHrToken}`)
        .send({ kpis: { headcount: 25, attendanceRate: 96.5 } });

      expect(res.status).toBe(200);
      expect(res.body.data.label).toBe('AI-generated');
      expect(res.body.data.summary).toContain('Headcount is 25');
    });

    it('Employee cannot access summary endpoint (403)', async () => {
      const res = await request(app)
        .post('/api/ai/summary')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ kpis: { headcount: 25 } });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/ai/smart-leave (T8.5)', () => {
    it('parses natural language and returns working days', async () => {
      vi.spyOn(aiService, 'parseSmartLeave').mockResolvedValueOnce({
        fallback: false,
        label: 'AI-generated',
        data: {
          leaveType: 'annual',
          startDate: '2026-11-02',
          endDate: '2026-11-04',
          reason: "Sister's wedding",
          workingDays: 3
        }
      });

      const res = await request(app)
        .post('/api/ai/smart-leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ text: 'Taking off Mon to Wed for sister wedding' });

      expect(res.status).toBe(200);
      expect(res.body.data.fallback).toBe(false);
      expect(res.body.data.data.workingDays).toBe(3);
    });

    it('returns fallback: true when parsing is inconclusive', async () => {
      vi.spyOn(aiService, 'parseSmartLeave').mockResolvedValueOnce({
        fallback: true
      });

      const res = await request(app)
        .post('/api/ai/smart-leave')
        .set('Authorization', `Bearer ${mockEmployeeToken}`)
        .send({ text: 'just random gibberish not a date' });

      expect(res.status).toBe(200);
      expect(res.body.data.fallback).toBe(true);
    });
  });
});
