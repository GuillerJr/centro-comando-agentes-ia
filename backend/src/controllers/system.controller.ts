import type { Request, Response } from 'express';
import { validateConnectionSchema } from '../schemas/system.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const systemController = {
  async health(_request: Request, response: Response) {
    const data = await commandCenterService.getSystemHealth();
    return response.json(successResponse('System health loaded', data));
  },
  async dashboard(_request: Request, response: Response) {
    const data = await commandCenterService.getDashboard();
    return response.json(successResponse('Dashboard loaded', data));
  },
  async openClawStatus(_request: Request, response: Response) {
    const data = await commandCenterService.getOpenClawStatus();
    return response.json(successResponse('OpenClaw status loaded', data));
  },
  async validateConnection(request: Request, response: Response) {
    const payload = validateConnectionSchema.parse(request.body ?? {});
    const data = await commandCenterService.validateOpenClawConnection(payload.mode);
    return response.json(successResponse('OpenClaw connection validated', data));
  },
  async commandConsole(_request: Request, response: Response) {
    const data = await commandCenterService.getCommandConsoleSnapshot();
    return response.json(successResponse('Command console snapshot loaded', data));
  },
};
