import type { Request, Response } from 'express';
import { createWorkspaceSchema } from '../schemas/workspace.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const workspacesController = {
  // Lista los workspaces base visibles en Mission Control.
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listWorkspaces();
    return response.json(successResponse('Workspaces cargados', data));
  },

  // Crea un workspace con su owner inicial para preparar aislamiento futuro.
  async create(request: Request, response: Response) {
    const payload = createWorkspaceSchema.parse(request.body);
    const data = await commandCenterService.createWorkspace(payload);
    return response.status(201).json(successResponse('Workspace creado', data));
  },
};
