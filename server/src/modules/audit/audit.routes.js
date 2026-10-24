import { Router } from 'express';
import { getAuditLogs } from './audit.service.js';
import { authenticate, requireRole, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

// Only Admin can view audit logs
router.get('/', authenticate, mustChangePasswordGuard, requireRole(['admin']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await getAuditLogs({
      actorId: req.query.actorId,
      action: req.query.action,
      entity: req.query.entity,
      page,
      limit
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export const auditRoutes = router;
