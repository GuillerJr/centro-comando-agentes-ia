import type { Request, Response } from 'express';
import { createSystemSettingSchema, updateSystemSettingSchema, updateSystemSettingVisibilitySchema, validateConnectionSchema } from '../schemas/system.schemas.js';
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
  async search(request: Request, response: Response) {
    const query = String(request.query.q ?? '');
    const data = await commandCenterService.globalSearch(query);
    return response.json(successResponse('Search results loaded', data));
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
  async listSettings(_request: Request, response: Response) {
    const data = await commandCenterService.listSystemSettings();
    return response.json(successResponse('System settings loaded', data));
  },
  async createSetting(request: Request, response: Response) {
    const payload = createSystemSettingSchema.parse(request.body);
    const data = await commandCenterService.createSystemSetting(payload);
    return response.status(201).json(successResponse('System setting created', data));
  },
  async updateSetting(request: Request, response: Response) {
    const payload = updateSystemSettingSchema.parse(request.body);
    const data = await commandCenterService.updateSystemSetting(String(request.params.settingId), payload);
    return response.json(successResponse('System setting updated', data));
  },
  async updateSettingVisibility(request: Request, response: Response) {
    const payload = updateSystemSettingVisibilitySchema.parse(request.body);
    const data = await commandCenterService.updateSystemSettingVisibility(String(request.params.settingId), payload.isSensitive);
    return response.json(successResponse('System setting visibility updated', data));
  },
};
