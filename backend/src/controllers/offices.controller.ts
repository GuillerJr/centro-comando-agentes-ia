import type { Request, Response } from 'express';
import { officeAssignmentIdParamsSchema, officeAssignmentPayloadSchema, officeStationIdParamsSchema, officeStationPayloadSchema, officeZoneIdParamsSchema, officeZonePayloadSchema } from '../schemas/office.schemas.js';
import { commandCenterService } from '../services/command-center.service.js';
import { successResponse } from '../utils/api.js';

export const officesController = {
  async currentLayout(_request: Request, response: Response) {
    const data = await commandCenterService.getCurrentOfficeLayout();
    return response.json(successResponse('Office layout loaded', data));
  },
  async currentState(_request: Request, response: Response) {
    const data = await commandCenterService.getCurrentOfficeState();
    return response.json(successResponse('Office state loaded', data));
  },
  async createZone(request: Request, response: Response) {
    const payload = officeZonePayloadSchema.parse(request.body);
    const data = await commandCenterService.createOfficeZone(payload);
    return response.status(201).json(successResponse('Office zone created', data));
  },
  async updateZone(request: Request, response: Response) {
    const { zoneId } = officeZoneIdParamsSchema.parse(request.params);
    const payload = officeZonePayloadSchema.parse(request.body);
    const data = await commandCenterService.updateOfficeZone(zoneId, payload);
    return response.json(successResponse('Office zone updated', data));
  },
  async deleteZone(request: Request, response: Response) {
    const { zoneId } = officeZoneIdParamsSchema.parse(request.params);
    const data = await commandCenterService.deleteOfficeZone(zoneId);
    return response.json(successResponse('Office zone deleted', data));
  },
  async createStation(request: Request, response: Response) {
    const payload = officeStationPayloadSchema.parse(request.body);
    const data = await commandCenterService.createOfficeStation(payload);
    return response.status(201).json(successResponse('Office station created', data));
  },
  async updateStation(request: Request, response: Response) {
    const { stationId } = officeStationIdParamsSchema.parse(request.params);
    const payload = officeStationPayloadSchema.parse(request.body);
    const data = await commandCenterService.updateOfficeStation(stationId, payload);
    return response.json(successResponse('Office station updated', data));
  },
  async deleteStation(request: Request, response: Response) {
    const { stationId } = officeStationIdParamsSchema.parse(request.params);
    const data = await commandCenterService.deleteOfficeStation(stationId);
    return response.json(successResponse('Office station deleted', data));
  },
  async createAssignment(request: Request, response: Response) {
    const payload = officeAssignmentPayloadSchema.parse(request.body);
    const data = await commandCenterService.createOfficeAssignment(payload);
    return response.status(201).json(successResponse('Office assignment created', data));
  },
  async updateAssignment(request: Request, response: Response) {
    const { assignmentId } = officeAssignmentIdParamsSchema.parse(request.params);
    const payload = officeAssignmentPayloadSchema.parse(request.body);
    const data = await commandCenterService.updateOfficeAssignment(assignmentId, payload);
    return response.json(successResponse('Office assignment updated', data));
  },
  async deleteAssignment(request: Request, response: Response) {
    const { assignmentId } = officeAssignmentIdParamsSchema.parse(request.params);
    const data = await commandCenterService.deleteOfficeAssignment(assignmentId);
    return response.json(successResponse('Office assignment deleted', data));
  },
};
