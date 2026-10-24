import { AuditLog } from './audit.model.js';

export async function logAudit({
  actorId,
  actorRole,
  action,
  entity,
  entityId,
  before = null,
  after = null,
  ip = null
}) {
  try {
    return await AuditLog.create({
      actorId,
      actorRole,
      action,
      entity,
      entityId: String(entityId),
      before,
      after,
      ip
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

export async function getAuditLogs({ actorId, action, entity, page = 1, limit = 20 }) {
  const query = {};
  if (actorId) query.actorId = actorId;
  if (action) query.action = action;
  if (entity) query.entity = entity;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find(query).sort({ at: -1 }).skip(skip).limit(limit).populate('actorId', 'email role'),
    AuditLog.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}
