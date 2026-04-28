import { Router } from 'express';
import { mcpController } from '../controllers/mcp.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/servers', asyncHandler(mcpController.listServers));
router.post('/servers', asyncHandler(mcpController.createServer));
router.get('/tools', asyncHandler(mcpController.listTools));

export default router;
