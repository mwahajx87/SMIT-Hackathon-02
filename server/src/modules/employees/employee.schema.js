import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  gender: z.enum(['male', 'female', 'other']).default('other'),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Join date must be YYYY-MM-DD'),
  status: z.enum(['probation', 'active']).default('active'),
  basicSalary: z.coerce.number().positive('Basic salary must be greater than 0')
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  exitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['probation', 'active', 'exited', 'inactive']).optional()
});

export const updateProfileSchema = z.object({
  phone: z.string().optional().default(''),
  address: z.string().optional().default('')
});

export const updateSalarySchema = z.object({
  basicSalary: z.coerce.number().positive('Basic salary must be greater than 0')
});
