import { z } from 'zod';

export const updateSettingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  officeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional(),
  graceMinutes: z.coerce.number().min(0).max(120).optional(),
  halfDayHours: z.coerce.number().min(1).max(12).optional(),
  weekendDays: z.array(z.number().min(0).max(6)).optional(),
  officeLat: z.coerce.number().nullable().optional(),
  officeLng: z.coerce.number().nullable().optional(),
  officeRadiusM: z.coerce.number().min(10).max(5000).optional(),
  hraPct: z.coerce.number().min(0).max(100).optional(),
  medicalPct: z.coerce.number().min(0).max(100).optional()
});

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required')
});

export const designationSchema = z.object({
  title: z.string().min(1, 'Designation title is required')
});

export const leaveTypeSchema = z.object({
  key: z.enum(['annual', 'sick', 'casual', 'unpaid']),
  name: z.string().min(1, 'Name is required'),
  yearlyQuota: z.coerce.number().nullable().optional(),
  isPaid: z.boolean().default(true)
});

export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  name: z.string().min(1, 'Holiday name is required')
});
