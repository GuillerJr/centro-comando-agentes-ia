import type { Request, Response } from 'express';
import { createMcpServerSchema } from '../schemas/mcp.schemas.js';
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
  async listTools(_request: Request, response: Response) {
    const data = await commandCenterService.listMcpTools();
    return response.json(successResponse('MCP tools loaded', data));
  },
};
