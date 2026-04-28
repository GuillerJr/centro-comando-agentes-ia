import { Router } from 'express';
import { approvalsController } from '../controllers/approvals.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(approvalsController.list));
router.post('/', asyncHandler(approvalsController.create));
router.patch('/:approvalId/approve', asyncHandler(approvalsController.approve));
router.patch('/:approvalId/reject', asyncHandler(approvalsController.reject));

export default router;
