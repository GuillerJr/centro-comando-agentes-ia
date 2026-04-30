import { Router } from 'express';
import { workspacesController } from '../controllers/workspaces.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(workspacesController.list));
router.post('/', asyncHandler(workspacesController.create));

export default router;
