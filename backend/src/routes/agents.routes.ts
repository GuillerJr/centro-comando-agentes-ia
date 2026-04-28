import { Router } from 'express';
import { agentsController } from '../controllers/agents.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(agentsController.list));
router.get('/:agentId', asyncHandler(agentsController.getById));
router.post('/', asyncHandler(agentsController.create));
router.put('/:agentId', asyncHandler(agentsController.update));
router.patch('/:agentId/status', asyncHandler(agentsController.updateStatus));

export default router;
