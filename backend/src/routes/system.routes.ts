import { Router } from 'express';
import { systemController } from '../controllers/system.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

router.get('/health', asyncHandler(systemController.health));
router.get('/dashboard', asyncHandler(systemController.dashboard));
router.get('/openclaw/status', asyncHandler(systemController.openClawStatus));
router.post('/openclaw/validate-connection', asyncHandler(systemController.validateConnection));
router.get('/command-console', asyncHandler(systemController.commandConsole));
router.get('/settings', asyncHandler(systemController.listSettings));
router.post('/settings', asyncHandler(systemController.createSetting));
router.put('/settings/:settingId', asyncHandler(systemController.updateSetting));
router.patch('/settings/:settingId/visibility', asyncHandler(systemController.updateSettingVisibility));

export default router;
