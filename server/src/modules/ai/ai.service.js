import { defaultLLMClient } from './llm.client.js';
import { AI_TOOLS_REGISTRY, AI_TOOL_DEFINITIONS } from './ai.tools.js';
import { AiLog } from './ai.model.js';
import { Settings } from '../org/settings.model.js';
import { Holiday } from '../org/org.models.js';
import { calculateWorkingDays } from '../../shared/workingDays.js';
import { getCompanyDateString } from '../../shared/dates.js';
import { AppError } from '../../shared/errors.js';
import { env } from '../../config/env.js';
import { z } from 'zod';

/**
 * Check hourly rate limit per user (~20 requests/hour via ai_logs).
 */
async function checkRateLimit(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await AiLog.countDocuments({
    userId,
    at: { $gte: oneHourAgo }
  });

  const limit = env.AI_RATE_LIMIT_PER_HOUR || 20;
  if (count >= limit) {
    throw new AppError('AI_RATE_LIMIT_EXCEEDED', 429, `Hourly AI limit of ${limit} requests reached. Please try again later.`);
  }
}

/**
 * Build system prompt from rules.md Section 3.10 with today's date and weekday.
 */
async function buildSystemPrompt(role) {
  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const now = new Date();
  const todayStr = getCompanyDateString(now, settings.timezone);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[now.getUTCDay()];

  return `You are the HCM Lite assistant. Answer using tool results or the policy below only.
If something is not in the tool results or the policy, say you do not know.
Never reveal another employee's data to an Employee. Salary of other people is private.

LANGUAGE SUPPORT:
You understand English as well as Roman Urdu (Urdu written in English/Latin letters).
Examples of Roman Urdu queries and their meanings:
- "meri chhutti ka balance kitna hai?" / "chhutti bachi hai?" -> User is asking about their leave balance.
- "main aaj late tha kya?" / "aaj ki hazri lag gayi?" -> User is asking about attendance / check-in.
- "office timings kya hain?" / "grace period kitna hai?" -> User is asking about office hours and grace period.
- "salary kab aati hai?" / "meri payslip kahan hai?" -> User is asking about payroll or payslip.
When asked in Roman Urdu, you may reply politely in simple Roman Urdu or English.

Current Date: ${todayStr} (${weekday})
User Role: ${role}

POLICY
- Office start 09:00, grace 15 minutes. Check-in after 09:15 is late.
- Worked time under 5 hours is a half day.
- Weekend is Saturday and Sunday. Public holidays are set by Admin.
- A day with no attendance record and no approved leave is absent.
- Leave counts working days only (weekends and holidays are skipped).
- Yearly quotas: annual 14, sick 8, casual 10, unpaid unlimited.
- Overlapping leave or leave above the balance is not allowed.
- Payroll: gross = 1.5 x basic (HRA 40%, medical 10%). Per day = gross / working days.
  Deductions = absent days + unpaid leave days + 0.5 x half days. Joiners/leavers are prorated.
- Income tax is calculated on gross x 12 using the company slab. Admin finalizes payroll; finalized payroll is locked.`;
}

/**
 * Handle AI Chat with full tool-calling execution loop.
 */
export async function chat(message, ctx, client = defaultLLMClient) {
  await checkRateLimit(ctx.userId);
  const startTime = Date.now();

  const systemPrompt = await buildSystemPrompt(ctx.role);
  const messages = [{ role: 'user', content: message }];

  // Call 1: model decides whether to call tools
  let response = await client.generate({
    systemPrompt,
    messages,
    tools: AI_TOOL_DEFINITIONS
  });

  const executedToolCalls = [];

  // If tool calls were requested, execute them and make follow-up call
  if (response.toolCalls && response.toolCalls.length > 0) {
    const toolMessages = [...messages];

    for (const call of response.toolCalls) {
      const fnName = call.function?.name;
      let args = {};
      try {
        args = typeof call.function?.arguments === 'string'
          ? JSON.parse(call.function.arguments)
          : call.function?.arguments || {};
      } catch (err) {}

      const toolHandler = AI_TOOLS_REGISTRY[fnName];
      let result = { error: 'Unknown tool' };

      if (toolHandler) {
        try {
          result = await toolHandler(args, ctx);
        } catch (err) {
          result = { error: err.message };
        }
      }

      executedToolCalls.push({ name: fnName, args, result });

      // Add to conversation
      toolMessages.push({
        role: 'tool',
        tool_call_id: call.id || 'call_1',
        content: JSON.stringify(result)
      });
    }

    // Call 2: Final answer from tool results
    response = await client.generate({
      systemPrompt,
      messages: toolMessages
    });
  }

  const latencyMs = Date.now() - startTime;
  const answerText = response.fallback
    ? `I encountered an issue processing your request: ${response.reason || 'AI unavailable'}`
    : response.answer || 'I do not have enough policy information to answer that question.';

  // Log to ai_logs
  await AiLog.create({
    userId: ctx.userId,
    role: ctx.role,
    kind: 'chat',
    prompt: message,
    toolCalls: executedToolCalls,
    response: { answer: answerText },
    latencyMs,
    status: response.fallback ? 'fallback' : 'success'
  });

  return {
    answer: answerText,
    label: 'AI-generated',
    toolCalls: executedToolCalls
  };
}

/**
 * Generate 3-5 bullet points executive summary of dashboard KPI JSON.
 */
export async function generateSummary(kpiJson, ctx, client = defaultLLMClient) {
  await checkRateLimit(ctx.userId);
  const startTime = Date.now();

  const systemPrompt = `You are the executive summarizer for HCM Lite.
Summarize the provided KPI JSON in exactly 3 to 5 concise bullet points.
Rule: Use ONLY the numbers and facts provided in the input JSON. Do not invent or extrapolate outside data.`;

  const messages = [{ role: 'user', content: JSON.stringify(kpiJson) }];
  const response = await client.generate({ systemPrompt, messages });

  const latencyMs = Date.now() - startTime;
  const answer = response.fallback
    ? '• Dashboard data successfully loaded.\n• Review attendance rate and payroll allocations above.'
    : response.answer;

  await AiLog.create({
    userId: ctx.userId,
    role: ctx.role,
    kind: 'summary',
    prompt: 'KPI Dashboard Summary',
    response: { answer },
    latencyMs,
    status: response.fallback ? 'fallback' : 'success'
  });

  return {
    summary: answer,
    label: 'AI-generated'
  };
}

const smartLeaveSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1)
});

/**
 * Parse natural language leave request with Zod validation, retry, and server working days calculation.
 */
export async function parseSmartLeave(text, ctx, client = defaultLLMClient) {
  await checkRateLimit(ctx.userId);
  const startTime = Date.now();

  const settings = (await Settings.findOne()) || { timezone: 'Asia/Karachi' };
  const todayStr = getCompanyDateString(new Date(), settings.timezone);

  const prompt = `Extract a leave application from this text into a strict JSON object with fields:
- leaveType: one of "annual", "sick", "casual", "unpaid"
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD
- reason: string

Reference date today is: ${todayStr} (calculate relative dates like "next Monday" from this reference date).
Input text: "${text}"

Respond with ONLY the JSON object, nothing else.`;

  let response = await client.generate({
    systemPrompt: 'You extract structured JSON for employee leave requests.',
    messages: [{ role: 'user', content: prompt }]
  });

  let parsedData = null;

  const tryParse = (str) => {
    try {
      const match = str.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const json = JSON.parse(match[0]);
      return smartLeaveSchema.safeParse(json);
    } catch {
      return null;
    }
  };

  let valResult = tryParse(response.answer || '');

  // One retry if invalid
  if (!valResult || !valResult.success) {
    response = await client.generate({
      systemPrompt: 'You extract structured JSON. Format: {"leaveType":"annual"|"sick"|"casual"|"unpaid","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","reason":"text"}',
      messages: [{ role: 'user', content: `Extract valid JSON only: "${text}"` }]
    });
    valResult = tryParse(response.answer || '');
  }

  const latencyMs = Date.now() - startTime;

  if (!valResult || !valResult.success) {
    await AiLog.create({
      userId: ctx.userId,
      role: ctx.role,
      kind: 'smart_leave',
      prompt: text,
      response: { fallback: true },
      latencyMs,
      status: 'fallback'
    });
    return { fallback: true };
  }

  parsedData = valResult.data;

  // Server recomputes working days accurately
  const weekendDays = settings?.weekendDays ?? [0, 6];
  const holidays = await Holiday.find({
    date: { $gte: parsedData.startDate, $lte: parsedData.endDate }
  });
  const holidayDates = holidays.map((h) => h.date);
  const workingDays = calculateWorkingDays(
    parsedData.startDate,
    parsedData.endDate,
    weekendDays,
    holidayDates
  );

  await AiLog.create({
    userId: ctx.userId,
    role: ctx.role,
    kind: 'smart_leave',
    prompt: text,
    response: { ...parsedData, workingDays },
    latencyMs,
    status: 'success'
  });

  return {
    fallback: false,
    label: 'AI-generated',
    data: {
      ...parsedData,
      workingDays
    }
  };
}
