import type { Request, Response } from 'express';
import { commandCenterService } from '../services/command-center.service.js';
import { createMissionSchema, missionIdParamsSchema, updateMissionSchema } from '../schemas/mission.schemas.js';
import { successResponse } from '../utils/api.js';

export const missionsController = {
  // Lista las misiones visibles para la bandeja principal.
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listMissions();
    return response.json(successResponse('Misiones cargadas', data));
  },

  // Recupera una misión concreta con su planificación actual.
  async getById(request: Request, response: Response) {
    const { missionId } = missionIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getMissionById(missionId);
    return response.json(successResponse('Misión cargada', data));
  },

  // Crea una misión a partir de un prompt y devuelve el plan inicial propuesto.
  async create(request: Request, response: Response) {
    const payload = createMissionSchema.parse(request.body);
    const data = await commandCenterService.createMissionFromPrompt(payload);
    return response.status(201).json(successResponse('Misión creada', data));
  },

  // Permite editar el plan antes o durante la ejecución controlada.
  async update(request: Request, response: Response) {
    const { missionId } = missionIdParamsSchema.parse(request.params);
    const payload = updateMissionSchema.parse(request.body);
    const data = await commandCenterService.updateMission(missionId, payload);
    return response.json(successResponse('Misión actualizada', data));
  },

  // Inicia la misión, crea su tarea base y solicita aprobación si el riesgo lo exige.
  async start(request: Request, response: Response) {
    const { missionId } = missionIdParamsSchema.parse(request.params);
    const data = await commandCenterService.startMission(missionId);
    return response.json(successResponse('Misión iniciada', data));
  },

  // Pausa una misión desde la capa de mando para frenar el flujo superior.
  async pause(request: Request, response: Response) {
    const { missionId } = missionIdParamsSchema.parse(request.params);
    const data = await commandCenterService.pauseMission(missionId);
    return response.json(successResponse('Misión pausada', data));
  },

  // Reanuda una misión siempre que no siga bloqueada por gobernanza.
  async resume(request: Request, response: Response) {
    const { missionId } = missionIdParamsSchema.parse(request.params);
    const data = await commandCenterService.resumeMission(missionId);
    return response.json(successResponse('Misión reanudada', data));
  },
};
