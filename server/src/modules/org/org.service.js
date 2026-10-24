import { Settings } from './settings.model.js';
import { Department, Designation, LeaveType, Holiday } from './org.models.js';
import { AppError } from '../../shared/errors.js';
import { logAudit } from '../audit/audit.service.js';

export async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      companyName: 'HCM Lite Company',
      setupComplete: false
    });
  }
  return settings;
}

export async function updateSettings(data, ctx) {
  const settings = await getSettings();
  const before = settings.toObject();

  Object.assign(settings, data);
  await settings.save();

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'update',
    entity: 'settings',
    entityId: settings._id,
    before,
    after: settings.toObject()
  });

  return settings;
}

// Departments
export async function getDepartments() {
  return Department.find().sort({ name: 1 });
}

export async function createDepartment(data, ctx) {
  const department = await Department.create(data);
  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'department',
    entityId: department._id,
    after: department.toObject()
  });
  return department;
}

export async function deleteDepartment(id, ctx) {
  const department = await Department.findByIdAndDelete(id);
  if (!department) throw new AppError('NOT_FOUND', 404, 'Department not found');
  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'update',
    entity: 'department',
    entityId: id,
    before: department.toObject()
  });
  return { message: 'Department deleted successfully' };
}

// Designations
export async function getDesignations() {
  return Designation.find().sort({ title: 1 });
}

export async function createDesignation(data, ctx) {
  const designation = await Designation.create(data);
  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'designation',
    entityId: designation._id,
    after: designation.toObject()
  });
  return designation;
}

export async function deleteDesignation(id, ctx) {
  const designation = await Designation.findByIdAndDelete(id);
  if (!designation) throw new AppError('NOT_FOUND', 404, 'Designation not found');
  return { message: 'Designation deleted successfully' };
}

// Leave Types
export async function getLeaveTypes() {
  return LeaveType.find().sort({ key: 1 });
}

export async function createLeaveType(data, ctx) {
  const leaveType = await LeaveType.create(data);
  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'leave_type',
    entityId: leaveType._id,
    after: leaveType.toObject()
  });
  return leaveType;
}

// Holidays
export async function getHolidays() {
  return Holiday.find().sort({ date: 1 });
}

export async function createHoliday(data, ctx) {
  const holiday = await Holiday.create(data);
  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'holiday',
    entityId: holiday._id,
    after: holiday.toObject()
  });
  return holiday;
}

export async function deleteHoliday(id, ctx) {
  const holiday = await Holiday.findByIdAndDelete(id);
  if (!holiday) throw new AppError('NOT_FOUND', 404, 'Holiday not found');
  return { message: 'Holiday deleted successfully' };
}
