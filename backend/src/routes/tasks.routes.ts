import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(tasksController.list));
router.get('/:taskId', asyncHandler(tasksController.getById));
router.post('/', asyncHandler(tasksController.create));
router.put('/:taskId', asyncHandler(tasksController.update));
router.post('/:taskId/run', asyncHandler(tasksController.run));
router.patch('/:taskId/cancel', asyncHandler(tasksController.cancel));
router.get('/:taskId/runs', asyncHandler(tasksController.getRuns));

export default router;
