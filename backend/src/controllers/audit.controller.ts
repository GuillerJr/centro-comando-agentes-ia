import type { Request, Response } from 'express';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const auditController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listAuditLogs();
    return response.json(successResponse('Audit logs loaded', data));
  },
};
