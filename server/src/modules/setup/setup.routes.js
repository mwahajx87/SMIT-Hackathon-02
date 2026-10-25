import { Router } from 'express';
import * as setupService from './setup.service.js';
import { setupSchema } from './setup.service.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

router.get('/status', async (req, res, next) => {
  try {
    const status = await setupService.getSetupStatus();
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(setupSchema), async (req, res, next) => {
  try {
    const result = await setupService.performSetup(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

export const setupRoutes = router;
