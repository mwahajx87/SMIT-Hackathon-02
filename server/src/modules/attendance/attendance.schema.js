import { z } from 'zod';

export const checkInSchema = z.object({
  source: z.enum(['web', 'camera']).optional().default('web'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  accuracy: z.coerce.number().optional(),
  faceVerified: z.boolean().optional()
});

export const requestCorrectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  requestedCheckIn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:mm').optional(),
  requestedCheckOut: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:mm').optional(),
  reason: z.string().min(1, 'Reason is required')
});

export const decideCorrectionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  decisionComment: z.string().min(1, 'Comment is required for correction decision')
});
