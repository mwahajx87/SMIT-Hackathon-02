import * as aiService from './ai.service.js';

export async function chat(req, res, next) {
  try {
    const result = await aiService.chat(req.body.message, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function generateSummary(req, res, next) {
  try {
    const result = await aiService.generateSummary(req.body.kpis, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function smartLeave(req, res, next) {
  try {
    const result = await aiService.parseSmartLeave(req.body.text, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
