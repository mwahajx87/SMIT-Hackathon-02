import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Settings } from '../org/settings.model.js';
import { User } from '../auth/user.model.js';
import { LeaveType } from '../org/org.models.js';
import { AppError } from '../../shared/errors.js';
import { env } from '../../config/env.js';

export const setupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export async function getSetupStatus() {
  const settings = await Settings.findOne();
  return {
    setupComplete: settings ? Boolean(settings.setupComplete) : false
  };
}

export async function performSetup({ companyName, adminEmail, adminPassword }) {
  let settings = await Settings.findOne();
  if (settings && settings.setupComplete) {
    throw new AppError('SETUP_ALREADY_COMPLETED', 409, 'Setup has already been completed.');
  }

  // Check if admin user already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    throw new AppError('SETUP_ALREADY_COMPLETED', 409, 'An Admin account already exists.');
  }

  // Create or update settings
  if (!settings) {
    settings = new Settings();
  }
  settings.companyName = companyName;
  settings.setupComplete = true;
  await settings.save();

  // Create default leave types if none exist
  const existingLeaveTypes = await LeaveType.countDocuments();
  if (existingLeaveTypes === 0) {
    await LeaveType.insertMany([
      { key: 'annual', name: 'Annual Leave', yearlyQuota: 14, isPaid: true },
      { key: 'sick', name: 'Sick Leave', yearlyQuota: 8, isPaid: true },
      { key: 'casual', name: 'Casual Leave', yearlyQuota: 10, isPaid: true },
      { key: 'unpaid', name: 'Unpaid Leave', yearlyQuota: null, isPaid: false }
    ]);
  }

  // Create Admin User
  const passwordHash = await bcrypt.hash(adminPassword, env.BCRYPT_ROUNDS);
  const adminUser = await User.create({
    email: adminEmail.toLowerCase(),
    passwordHash,
    role: 'admin',
    mustChangePassword: false
  });

  return {
    companyName: settings.companyName,
    adminEmail: adminUser.email,
    setupComplete: true
  };
}
