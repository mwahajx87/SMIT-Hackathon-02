import * as authService from './auth.service.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.ctx.userId, currentPassword, newPassword);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.ctx.userId);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}
