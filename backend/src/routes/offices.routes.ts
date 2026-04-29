import { Router } from 'express';
import { officesController } from '../controllers/offices.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireFutureAuth } from '../middleware/require-future-auth.js';

const router = Router();

router.get('/current/layout', asyncHandler(officesController.currentLayout));
router.get('/current/state', asyncHandler(officesController.currentState));
router.use(requireFutureAuth);
router.post('/current/zones', asyncHandler(officesController.createZone));
router.put('/current/zones/:zoneId', asyncHandler(officesController.updateZone));
router.delete('/current/zones/:zoneId', asyncHandler(officesController.deleteZone));
router.post('/current/stations', asyncHandler(officesController.createStation));
router.put('/current/stations/:stationId', asyncHandler(officesController.updateStation));
router.delete('/current/stations/:stationId', asyncHandler(officesController.deleteStation));
router.post('/current/assignments', asyncHandler(officesController.createAssignment));
router.put('/current/assignments/:assignmentId', asyncHandler(officesController.updateAssignment));
router.delete('/current/assignments/:assignmentId', asyncHandler(officesController.deleteAssignment));

export default router;
