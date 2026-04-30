import { Router } from 'express';
import { workflowsController } from '../controllers/workflows.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(workflowsController.list));
router.post('/', asyncHandler(workflowsController.create));
router.post('/:workflowId/launch', asyncHandler(workflowsController.launch));

export default router;
