import { Router } from 'express';
import { officesController } from '../controllers/offices.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

router.get('/current/layout', asyncHandler(officesController.currentLayout));
router.get('/current/state', asyncHandler(officesController.currentState));

export default router;
