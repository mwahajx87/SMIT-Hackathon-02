import * as leaveService from './leave.service.js';

export async function applyLeave(req, res, next) {
  try {
    const result = await leaveService.applyLeave(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function cancelLeave(req, res, next) {
  try {
    const result = await leaveService.cancelLeave(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBalance(req, res, next) {
  try {
    const employeeId = req.ctx.role === 'employee' ? req.ctx.employeeId : req.ctx.employeeId;
    const year = req.query.year || String(new Date().getFullYear());
    const balances = await leaveService.getAllBalances(employeeId, year);
    res.json({ data: balances });
  } catch (err) {
    next(err);
  }
}

export async function listLeave(req, res, next) {
  try {
    const result = await leaveService.listLeaveRequests(req.query, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getLeaveInbox(req, res, next) {
  try {
    const result = await leaveService.getLeaveInbox(req.query, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function decideLeave(req, res, next) {
  try {
    const result = await leaveService.decideLeave(req.params.id, req.body, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
