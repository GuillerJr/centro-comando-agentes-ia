import type { Request, Response } from 'express';
import { commandCenterService } from '../services/command-center.service.js';
import { createWorkflowTemplateSchema, launchWorkflowSchema, workflowIdParamsSchema } from '../schemas/workflow.schemas.js';
import { successResponse } from '../utils/api.js';

export const workflowsController = {
  // Lista las plantillas de flujo reutilizables disponibles en Mission Control.
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listWorkflowTemplates();
    return response.json(successResponse('Plantillas de flujo cargadas', data));
  },

  // Crea una plantilla operativa para repetir misiones con estructura consistente.
  async create(request: Request, response: Response) {
    const payload = createWorkflowTemplateSchema.parse(request.body);
    const data = await commandCenterService.createWorkflowTemplate(payload);
    return response.status(201).json(successResponse('Plantilla de flujo creada', data));
  },

  // Lanza una misión nueva a partir de la plantilla seleccionada.
  async launch(request: Request, response: Response) {
    const { workflowId } = workflowIdParamsSchema.parse(request.params);
    const payload = launchWorkflowSchema.parse(request.body);
    const data = await commandCenterService.launchWorkflowTemplate(workflowId, payload);
    return response.json(successResponse('Plantilla lanzada como misión', data));
  },
};
