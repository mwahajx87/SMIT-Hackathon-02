import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  body: z.string().min(1, 'Body is required'),
  priority: z.enum(['normal', 'urgent']).optional().default('normal')
});
