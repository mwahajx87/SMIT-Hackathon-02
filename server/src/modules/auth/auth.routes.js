import { Router } from 'express';
import * as authController from './auth.controller.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, mustChangePasswordGuard } from '../../middleware/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export const authRoutes = router;
