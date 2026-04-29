import type { Request, Response } from 'express';
import { runIdParamsSchema, updateRunStatusSchema } from '../schemas/run.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const runsController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listRuns();
    return response.json(successResponse('Runs loaded', data));
  },
  async getById(request: Request, response: Response) {
    const { runId } = runIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getRunById(runId);
    return response.json(successResponse('Run loaded', data));
  },
  async updateStatus(request: Request, response: Response) {
    const { runId } = runIdParamsSchema.parse(request.params);
    const payload = updateRunStatusSchema.parse(request.body);
    const data = await commandCenterService.updateRunStatus(runId, payload);
    return response.json(successResponse('Run status updated', data));
  },
};
