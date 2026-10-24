import { Announcement, Notification } from './comms.model.js';
import { User } from '../auth/user.model.js';
import { AppError } from '../../shared/errors.js';
import { logAudit } from '../audit/audit.service.js';

/**
 * Create a new announcement (Admin or HR).
 */
export async function createAnnouncement({ title, body, priority = 'normal' }, ctx) {
  const item = await Announcement.create({
    title,
    body,
    priority,
    postedBy: ctx.userId
  });

  await logAudit({
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'create',
    entity: 'announcement',
    entityId: item._id,
    after: { title, priority }
  });

  return item;
}

/**
 * List announcements (Accessible to all authenticated users).
 */
export async function listAnnouncements(limit = 20) {
  return Announcement.find()
    .populate('postedBy', 'email role')
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Send an in-app notification to a user.
 */
export async function createNotification({ userId, type, title, body, link = null }) {
  try {
    return await Notification.create({
      userId,
      type,
      title,
      body,
      link
    });
  } catch (err) {
    console.error('Failed to create in-app notification:', err);
  }
}

/**
 * Notify all employees of payslip availability upon payroll finalization.
 */
export async function notifyPayrollFinalized(run) {
  try {
    const employeeIds = run.items.map((i) => i.employeeId);
    const users = await User.find({ employeeId: { $in: employeeIds } });

    const notifications = users.map((u) => ({
      userId: u._id,
      type: 'payslip_ready',
      title: 'Payslip Ready',
      body: `Your salary payslip for ${run.month} is now finalized and ready for viewing.`,
      link: '/payslips'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Failed to broadcast payslip ready notifications:', err);
  }
}

/**
 * List notifications for the authenticated user.
 */
export async function getUserNotifications(ctx) {
  const items = await Notification.find({ userId: ctx.userId })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    userId: ctx.userId,
    readAt: null
  });

  return { items, unreadCount };
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id, ctx) {
  const notification = await Notification.findOne({ _id: id, userId: ctx.userId });
  if (!notification) {
    throw new AppError('NOT_FOUND', 404, 'Notification not found.');
  }

  notification.readAt = new Date();
  await notification.save();
  return notification;
}

/**
 * Mark all user notifications as read.
 */
export async function markAllNotificationsAsRead(ctx) {
  await Notification.updateMany(
    { userId: ctx.userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { success: true };
}
