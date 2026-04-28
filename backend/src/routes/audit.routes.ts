import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(auditController.list));

export default router;
