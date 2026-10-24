import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../auth/user.model.js';
import { Employee } from '../employees/employee.model.js';
import { getNextSequence } from '../shared/counter.model.js';
import { AppError } from '../../shared/errors.js';
import { env } from '../../config/env.js';
import { logAudit } from '../audit/audit.service.js';

export async function createHrUser({ email, name, departmentId, designationId, basicSalary, joinDate }, ctx) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'A user with this email already exists.');
  }

  // Generate temporary password
  const tempPassword = `HR-${crypto.randomBytes(4).toString('hex')}!`;
  const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);

  // Generate Employee Code (EMP-0001 format)
  const seq = await getNextSequence('employee_code');
  const code = `EMP-${String(seq).padStart(4, '0')}`;

  // Create linked employee record first
  const employee = await Employee.create({
    code,
    name,
    email: email.toLowerCase(),
    departmentId,
    designationId,
    basicSalary,
    joinDate,
    status: 'active'
  });

  // Create HR User
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: 'hr',
    employeeId: employee._id,
    mustChangePassword: true
  });

  // Link employee to user
  employee.userId = user._id;
  await employee.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'user',
    entityId: user._id,
    after: { email: user.email, role: user.role, employeeId: employee._id }
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      employeeId: employee._id,
      code: employee.code,
      name: employee.name
    },
    tempPassword // shown once to admin to hand over
  };
}

export async function deactivateUser(userId, ctx) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 404, 'User not found.');
  if (user.role === 'admin') throw new AppError('CANNOT_DEACTIVATE_ADMIN', 400, 'Cannot deactivate Admin user.');

  user.isActive = !user.isActive;
  await user.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'deactivate',
    entity: 'user',
    entityId: user._id,
    after: { isActive: user.isActive }
  });

  return { id: user._id, isActive: user.isActive };
}

export async function resetPassword(userId, ctx) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 404, 'User not found.');

  const tempPassword = `Reset-${crypto.randomBytes(4).toString('hex')}!`;
  user.passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
  user.mustChangePassword = true;
  await user.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'reset_password',
    entity: 'user',
    entityId: user._id
  });

  return { tempPassword };
}

export async function listUsers(query = {}) {
  return User.find(query).select('-passwordHash').populate('employeeId');
}
