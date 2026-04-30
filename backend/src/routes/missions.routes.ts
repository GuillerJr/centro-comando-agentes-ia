import { Router } from 'express';
import { missionsController } from '../controllers/missions.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(missionsController.list));
router.get('/:missionId', asyncHandler(missionsController.getById));
router.post('/', asyncHandler(missionsController.create));
router.put('/:missionId', asyncHandler(missionsController.update));
router.post('/:missionId/start', asyncHandler(missionsController.start));
router.post('/:missionId/pause', asyncHandler(missionsController.pause));
router.post('/:missionId/resume', asyncHandler(missionsController.resume));

export default router;
