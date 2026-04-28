import type { Request, Response } from 'express';
import { approvalIdParamsSchema, createApprovalSchema, reviewApprovalSchema } from '../schemas/approval.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const approvalsController = {
  async list(_request: Request, response: Response) {
    const data = await commandCenterService.listApprovals();
    return response.json(successResponse('Approvals loaded', data));
  },
  async create(request: Request, response: Response) {
    const payload = createApprovalSchema.parse(request.body);
    const data = await commandCenterService.createApproval(payload);
    return response.status(201).json(successResponse('Approval created', data));
  },
  async approve(request: Request, response: Response) {
    const { approvalId } = approvalIdParamsSchema.parse(request.params);
    const payload = reviewApprovalSchema.parse(request.body);
    const data = await commandCenterService.approveApproval(approvalId, payload);
    return response.json(successResponse('Approval approved', data));
  },
  async reject(request: Request, response: Response) {
    const { approvalId } = approvalIdParamsSchema.parse(request.params);
    const payload = reviewApprovalSchema.parse(request.body);
    const data = await commandCenterService.rejectApproval(approvalId, payload);
    return response.json(successResponse('Approval rejected', data));
  },
};
