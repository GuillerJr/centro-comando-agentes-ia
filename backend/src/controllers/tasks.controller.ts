import type { Request, Response } from 'express';
import { runTaskSchema, taskIdParamsSchema, createTaskSchema, updateTaskSchema } from '../schemas/task.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const tasksController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listTasks();
    return response.json(successResponse('Tasks loaded', data));
  },
  async getById(request: Request, response: Response) {
    const { taskId } = taskIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getTaskById(taskId);
    return response.json(successResponse('Task loaded', data));
  },
  async create(request: Request, response: Response) {
    const payload = createTaskSchema.parse(request.body);
    const data = await commandCenterService.createTask(payload);
    return response.status(201).json(successResponse('Task created', data));
  },
  async update(request: Request, response: Response) {
    const { taskId } = taskIdParamsSchema.parse(request.params);
    const payload = updateTaskSchema.parse(request.body);
    const data = await commandCenterService.updateTask(taskId, payload);
    return response.json(successResponse('Task updated', data));
  },
  async run(request: Request, response: Response) {
    const { taskId } = taskIdParamsSchema.parse(request.params);
    const payload = runTaskSchema.parse(request.body);
    const data = await commandCenterService.runTask(taskId, payload);
    return response.json(successResponse('Task executed', data));
  },
  async cancel(request: Request, response: Response) {
    const { taskId } = taskIdParamsSchema.parse(request.params);
    const data = await commandCenterService.cancelTask(taskId);
    return response.json(successResponse('Task cancelled', data));
  },
  async getRuns(request: Request, response: Response) {
    const { taskId } = taskIdParamsSchema.parse(request.params);
    const data = await commandCenterService.getTaskRuns(taskId);
    return response.json(successResponse('Task runs loaded', data));
  },
};
