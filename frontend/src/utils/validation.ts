import { z } from 'zod';

export const agentFormSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  agentType: z.enum(['orchestrator', 'specialist', 'executor', 'observer', 'system']),
  priority: z.number().min(1).max(100),
  executionLimit: z.number().min(1).max(100),
});

export const taskFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  taskType: z.enum(['frontend', 'backend', 'database', 'mcp', 'fullstack', 'infrastructure', 'documentation']),
  requestedAction: z.string().min(3),
});

export const skillFormSchema = z.object({
  canonicalName: z.string().min(2),
  description: z.string().min(10),
  skillType: z.enum(['governance', 'architecture', 'frontend', 'backend', 'database', 'mcp', 'ui', 'fullstack', 'operations']),
  whenToUse: z.string().min(10),
  whenNotToUse: z.string().min(10),
});

export const approvalReviewSchema = z.object({
  reviewedBy: z.string().min(2),
  executionNotes: z.string().optional(),
});

export const officeZoneFormSchema = z.object({
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(140),
  subtitle: z.string().trim().min(10),
  zoneType: z.enum(['control', 'delivery', 'review', 'integration', 'focus', 'observability']),
  accent: z.string().trim().min(3).max(120),
  gridX: z.number().int().min(0),
  gridY: z.number().int().min(0),
  gridW: z.number().int().min(1),
  gridH: z.number().int().min(1),
  displayOrder: z.number().int().min(0),
});

export const officeStationFormSchema = z.object({
  zoneId: z.string().uuid('Selecciona una zona válida.'),
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(140),
  stationType: z.enum(['desk', 'table', 'booth', 'console', 'gateway']),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']),
  capacity: z.number().int().min(1).max(20),
});

export const officeAssignmentFormSchema = z.object({
  stationId: z.string().uuid('Selecciona una estación válida.'),
  agentId: z.string().uuid('Selecciona un agente válido.'),
  taskId: z.string().uuid().nullable(),
  assignmentRole: z.string().trim().min(3).max(80),
  presenceStatus: z.enum(['present', 'focusing', 'in_review', 'away']),
  isPrimary: z.boolean(),
  notes: z.string().trim().max(400).nullable(),
});
