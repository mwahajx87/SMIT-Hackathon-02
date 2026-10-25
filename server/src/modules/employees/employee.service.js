import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Employee } from './employee.model.js';
import { User } from '../auth/user.model.js';
import { getNextSequence } from '../shared/counter.model.js';
import { AppError } from '../../shared/errors.js';
import { env } from '../../config/env.js';
import { logAudit } from '../audit/audit.service.js';
import { getPaginationParams, formatPaginatedResponse } from '../../shared/pagination.js';

export async function createEmployee(data, ctx) {
  const existingEmployee = await Employee.findOne({ email: data.email.toLowerCase() });
  if (existingEmployee) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'An employee with this email already exists.');
  }

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'A user account with this email already exists.');
  }

  // Generate employee code (EMP-0001)
  const seq = await getNextSequence('employee_code');
  const code = `EMP-${String(seq).padStart(4, '0')}`;

  // Generate temporary password
  const tempPassword = `Emp-${crypto.randomBytes(4).toString('hex')}!`;
  const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);

  // Create Employee
  const employee = await Employee.create({
    code,
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || '',
    address: data.address || '',
    gender: data.gender || 'other',
    departmentId: data.departmentId,
    designationId: data.designationId,
    joinDate: data.joinDate,
    status: data.status || 'active',
    basicSalary: data.basicSalary
  });

  // Create linked User login
  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    role: 'employee',
    employeeId: employee._id,
    mustChangePassword: true
  });

  employee.userId = user._id;
  await employee.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'employee',
    entityId: employee._id,
    after: { code: employee.code, name: employee.name, email: employee.email }
  });

  return {
    employee: await employee.populate(['departmentId', 'designationId']),
    tempPassword // shown once to HR to hand over
  };
}

export async function listEmployees(query, ctx) {
  // If caller is Employee, force scope to self
  if (ctx.role === 'employee') {
    if (!ctx.employeeId) {
      return formatPaginatedResponse([], 0, 1, 10);
    }
    const emp = await Employee.findById(ctx.employeeId).populate(['departmentId', 'designationId']);
    return formatPaginatedResponse(emp ? [emp] : [], emp ? 1 : 0, 1, 10);
  }

  const filter = {};
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.designationId) filter.designationId = query.designationId;
  if (query.status) filter.status = query.status;

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }, { code: searchRegex }];
  }

  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('departmentId', 'name code')
      .populate('designationId', 'title'),
    Employee.countDocuments(filter)
  ]);

  return formatPaginatedResponse(items, total, page, limit);
}

export async function getEmployeeById(id, ctx) {
  // Scope check: If caller is employee, they cannot view anyone else
  if (ctx.role === 'employee' && String(ctx.employeeId) !== String(id)) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  const employee = await Employee.findById(id)
    .populate('departmentId', 'name code')
    .populate('designationId', 'title')
    .populate('userId', 'role isActive lastLoginAt');

  if (!employee) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  return employee;
}

export async function updateEmployee(id, data, ctx) {
  const employee = await Employee.findById(id);
  if (!employee) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  const before = employee.toObject();
  Object.assign(employee, data);
  await employee.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'update',
    entity: 'employee',
    entityId: employee._id,
    before,
    after: employee.toObject()
  });

  return employee.populate(['departmentId', 'designationId']);
}

export async function updateMyProfile(data, ctx) {
  if (!ctx.employeeId) {
    throw new AppError('EMPLOYEE_RECORD_REQUIRED', 400, 'User is not linked to an employee record.');
  }

  const employee = await Employee.findById(ctx.employeeId);
  if (!employee) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  // Employee can only update phone and address
  employee.phone = data.phone ?? employee.phone;
  employee.address = data.address ?? employee.address;
  await employee.save();

  return employee;
}

export async function getEmployeeSalary(id, ctx) {
  // Employee cannot access salary endpoint directly
  if (ctx.role === 'employee') {
    throw new AppError('FORBIDDEN', 403, 'Permission denied.');
  }

  const employee = await Employee.findById(id).select('code name basicSalary departmentId designationId');
  if (!employee) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  // Calculate gross breakdown: HRA 40%, Medical 10%
  const basic = employee.basicSalary;
  const hra = basic * 0.4;
  const medical = basic * 0.1;
  const gross = basic * 1.5;

  return {
    employeeId: employee._id,
    code: employee.code,
    name: employee.name,
    basicSalary: basic,
    hra,
    medical,
    gross
  };
}

export async function updateEmployeeSalary(id, { basicSalary }, ctx) {
  // HR can update, but cannot edit own salary
  if (ctx.role === 'employee') {
    throw new AppError('FORBIDDEN', 403, 'Permission denied.');
  }

  if (ctx.employeeId && String(ctx.employeeId) === String(id)) {
    throw new AppError('FORBIDDEN', 403, 'You cannot edit your own salary.');
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new AppError('NOT_FOUND', 404, 'Employee record not found.');
  }

  const beforeSalary = employee.basicSalary;
  employee.basicSalary = basicSalary;
  await employee.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'update',
    entity: 'salary',
    entityId: employee._id,
    before: { basicSalary: beforeSalary },
    after: { basicSalary: employee.basicSalary }
  });

  return getEmployeeSalary(id, ctx);
}
