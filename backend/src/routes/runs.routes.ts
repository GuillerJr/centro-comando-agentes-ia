import { Router } from 'express';
import { runsController } from '../controllers/runs.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(runsController.list));
router.get('/:runId', asyncHandler(runsController.getById));

export default router;
