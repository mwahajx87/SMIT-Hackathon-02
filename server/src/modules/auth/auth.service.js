import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { AppError } from '../../shared/errors.js';
import { env } from '../../config/env.js';

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      employeeId: user.employeeId || null,
      mustChangePassword: user.mustChangePassword
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      mustChangePassword: user.mustChangePassword
    }
  };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404, 'User not found.');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('INVALID_CURRENT_PASSWORD', 400, 'Current password does not match.');
  }

  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.mustChangePassword = false;
  await user.save();

  // Generate refreshed token with mustChangePassword=false
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      employeeId: user.employeeId || null,
      mustChangePassword: false
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { token, message: 'Password changed successfully.' };
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId).select('-passwordHash').populate('employeeId');
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404, 'User not found.');
  }
  return user;
}
