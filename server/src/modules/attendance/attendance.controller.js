import * as attService from './attendance.service.js';

export async function checkIn(req, res, next) {
  try {
    const result = await attService.checkIn(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req, res, next) {
  try {
    const result = await attService.checkOut(req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getToday(req, res, next) {
  try {
    const result = await attService.getTodayStatus(req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCalendar(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const result = await attService.getCalendar(month, req.query.employeeId, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBoard(req, res, next) {
  try {
    const result = await attService.getAttendanceBoard(req.query.date, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function requestCorrection(req, res, next) {
  try {
    const result = await attService.requestCorrection(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listCorrections(req, res, next) {
  try {
    const result = await attService.listCorrections(req.query, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function decideCorrection(req, res, next) {
  try {
    const result = await attService.decideCorrection(req.params.id, req.body, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
