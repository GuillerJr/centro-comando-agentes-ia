import { z } from 'zod';

export const officeZoneIdParamsSchema = z.object({ zoneId: z.string().uuid() });
export const officeStationIdParamsSchema = z.object({ stationId: z.string().uuid() });
export const officeAssignmentIdParamsSchema = z.object({ assignmentId: z.string().uuid() });

const metadataSchema = z.record(z.any()).optional().default({});

export const officeZonePayloadSchema = z.object({
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(140),
  subtitle: z.string().trim().min(10),
  zoneType: z.enum(['control', 'delivery', 'review', 'integration', 'focus', 'observability']),
  accent: z.string().trim().min(3).max(120),
  gridX: z.number().int().min(0),
  gridY: z.number().int().min(0),
  gridW: z.number().int().min(1),
  gridH: z.number().int().min(1),
  displayOrder: z.number().int().min(0).default(0),
  metadata: metadataSchema,
});

export const officeStationPayloadSchema = z.object({
  zoneId: z.string().uuid(),
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(140),
  stationType: z.enum(['desk', 'table', 'booth', 'console', 'gateway']),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']),
  capacity: z.number().int().min(1).max(20),
  metadata: metadataSchema,
});

export const officeAssignmentPayloadSchema = z.object({
  stationId: z.string().uuid(),
  agentId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional().default(null),
  assignmentRole: z.string().trim().min(3).max(80),
  presenceStatus: z.enum(['present', 'focusing', 'in_review', 'away']).default('present'),
  isPrimary: z.boolean().default(true),
  notes: z.string().trim().max(400).nullable().optional().default(null),
  metadata: metadataSchema,
});
