import type { Request, Response } from 'express';
import { createSkillSchema, skillIdParamsSchema, updateSkillSchema } from '../schemas/skill.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const skillsController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listSkills();
    return response.json(successResponse('Skills loaded', data));
  },
  async getById(request: Request, response: Response) {
    const { skillId } = skillIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getSkillById(skillId);
    return response.json(successResponse('Skill loaded', data));
  },
  async create(request: Request, response: Response) {
    const payload = createSkillSchema.parse(request.body);
    const data = await commandCenterService.createSkill(payload);
    return response.status(201).json(successResponse('Skill created', data));
  },
  async update(request: Request, response: Response) {
    const { skillId } = skillIdParamsSchema.parse(request.params);
    const payload = updateSkillSchema.parse(request.body);
    const data = await commandCenterService.updateSkill(skillId, payload);
    return response.json(successResponse('Skill updated', data));
  },
};
