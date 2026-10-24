import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 401, 'Authentication token missing or invalid.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    // Set standard request context
    req.ctx = {
      userId: decoded.userId,
      role: decoded.role,
      employeeId: decoded.employeeId,
      mustChangePassword: decoded.mustChangePassword
    };
    next();
  } catch (err) {
    return next(new AppError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.'));
  }
}

export function mustChangePasswordGuard(req, res, next) {
  // Allow only password change, auth/me, and logout if user must change password
  const allowedPaths = ['/auth/change-password', '/auth/me'];
  const currentPath = req.baseUrl + req.path;

  if (req.user?.mustChangePassword) {
    const isAllowed = allowedPaths.some((p) => currentPath.endsWith(p));
    if (!isAllowed) {
      return next(
        new AppError('PASSWORD_CHANGE_REQUIRED', 403, 'You must change your password before accessing the system.')
      );
    }
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 403, 'You do not have permission to perform this action.'));
    }

    next();
  };
}
