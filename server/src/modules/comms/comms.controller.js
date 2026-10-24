import * as commsService from './comms.service.js';

export async function createAnnouncement(req, res, next) {
  try {
    const result = await commsService.createAnnouncement(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listAnnouncements(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await commsService.listAnnouncements(limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUserNotifications(req, res, next) {
  try {
    const result = await commsService.getUserNotifications(req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const result = await commsService.markNotificationAsRead(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const result = await commsService.markAllNotificationsAsRead(req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
