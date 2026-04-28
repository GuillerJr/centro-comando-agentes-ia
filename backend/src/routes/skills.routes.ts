import { Router } from 'express';
import { skillsController } from '../controllers/skills.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.use(requireFutureAuth);
router.get('/', asyncHandler(skillsController.list));
router.get('/:skillId', asyncHandler(skillsController.getById));
router.post('/', asyncHandler(skillsController.create));
router.put('/:skillId', asyncHandler(skillsController.update));

export default router;
