import type { Request, Response } from 'express';
import { createMcpServerSchema, updateMcpServerSchema, updateMcpServerStatusSchema } from '../schemas/mcp.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const mcpController = {
  async listServers(_request: Request, response: Response) {
    const data = await commandCenterService.listMcpServers();
    return response.json(successResponse('MCP servers loaded', data));
  },
  async createServer(request: Request, response: Response) {
    const payload = createMcpServerSchema.parse(request.body);
    const data = await commandCenterService.createMcpServer(payload);
    return response.status(201).json(successResponse('MCP server created', data));
  },
  async updateServer(request: Request, response: Response) {
    const payload = updateMcpServerSchema.parse(request.body);
    const data = await commandCenterService.updateMcpServer(String(request.params.serverId), payload);
    return response.json(successResponse('MCP server updated', data));
  },
  async updateServerStatus(request: Request, response: Response) {
    const payload = updateMcpServerStatusSchema.parse(request.body);
    const data = await commandCenterService.updateMcpServerStatus(String(request.params.serverId), payload.status);
    return response.json(successResponse('MCP server status updated', data));
  },
  async listTools(_request: Request, response: Response) {
    const data = await commandCenterService.listMcpTools();
    return response.json(successResponse('MCP tools loaded', data));
  },
};
