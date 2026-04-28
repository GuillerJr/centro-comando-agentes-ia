import type { Request, Response } from 'express';
import { createAgentSchema, agentIdParamsSchema, updateAgentSchema, updateAgentStatusSchema } from '../schemas/agent.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const agentsController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listAgents();
    return response.json(successResponse('Agents loaded', data));
  },
  async getById(request: Request, response: Response) {
    const { agentId } = agentIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getAgentById(agentId);
    return response.json(successResponse('Agent loaded', data));
  },
  async create(request: Request, response: Response) {
    const payload = createAgentSchema.parse(request.body);
    const data = await commandCenterService.createAgent(payload);
    return response.status(201).json(successResponse('Agent created', data));
  },
  async update(request: Request, response: Response) {
    const { agentId } = agentIdParamsSchema.parse(request.params);
    const payload = updateAgentSchema.parse(request.body);
    const data = await commandCenterService.updateAgent(agentId, payload);
    return response.json(successResponse('Agent updated', data));
  },
  async updateStatus(request: Request, response: Response) {
    const { agentId } = agentIdParamsSchema.parse(request.params);
    const payload = updateAgentStatusSchema.parse(request.body);
    const data = await commandCenterService.updateAgentStatus(agentId, payload.status);
    return response.json(successResponse('Agent status updated', data));
  },
};
