import type { Request, Response } from 'express';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const officesController = {
  async currentLayout(_request: Request, response: Response) {
    const data = await commandCenterService.getCurrentOfficeLayout();
    return response.json(successResponse('Office layout loaded', data));
  },
  async currentState(_request: Request, response: Response) {
    const data = await commandCenterService.getCurrentOfficeState();
    return response.json(successResponse('Office state loaded', data));
  },
};
