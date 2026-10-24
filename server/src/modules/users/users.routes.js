import { Router } from 'express';
import * as usersService from './users.service.js';
import { createHrSchema } from '../auth/auth.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireRole, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

// Only Admin can manage users
router.use(authenticate, mustChangePasswordGuard, requireRole(['admin']));

router.get('/', async (req, res, next) => {
  try {
    const list = await usersService.listUsers();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/hr', validate(createHrSchema), async (req, res, next) => {
  try {
    const result = await usersService.createHrUser(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/deactivate', async (req, res, next) => {
  try {
    const result = await usersService.deactivateUser(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const result = await usersService.resetPassword(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export const userRoutes = router;
