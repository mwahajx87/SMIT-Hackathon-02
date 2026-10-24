import * as analyticsService from './analytics.service.js';

export async function getAdminDashboard(req, res, next) {
  try {
    const data = await analyticsService.getAdminDashboard(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getHrDashboard(req, res, next) {
  try {
    const data = await analyticsService.getHrDashboard(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeDashboard(req, res, next) {
  try {
    const data = await analyticsService.getEmployeeDashboard(req.ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getAnomalies(req, res, next) {
  try {
    const { getAbsenceAnomalies } = await import('./anomaly.service.js');
    const data = await getAbsenceAnomalies();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getAttritionRisk(req, res, next) {
  try {
    const { getAttritionRiskScores } = await import('./anomaly.service.js');
    const data = await getAttritionRiskScores();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
