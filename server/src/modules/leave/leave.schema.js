import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const applyLeaveSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid']),
  startDate: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  reason: z.string().min(1, 'Reason is required').max(500)
});

export const decideLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  decisionComment: z.string().min(1, 'Comment is required for leave decision')
});

export const leaveListQuerySchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid']).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
