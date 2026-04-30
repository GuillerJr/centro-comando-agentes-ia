import { z } from 'zod';

// Valida los pasos que el planificador propone para ejecutar una misión.
const missionPlanStepSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  sensitive: z.boolean().default(false),
});

// Valida la creación de una misión desde lenguaje natural.
export const createMissionSchema = z.object({
  prompt: z.string().min(12, 'La misión debe explicar mejor el objetivo.'),
  createdBy: z.string().min(2).default('Guiller'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  sandbox: z.boolean().default(true),
  workspaceId: z.string().uuid().optional(),
});

// Valida el cuerpo editable del plan antes de iniciar una misión.
export const updateMissionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  objective: z.string().min(3),
  status: z.enum(['draft', 'planned', 'queued', 'waiting_for_openclaw', 'running', 'waiting_for_approval', 'paused', 'blocked', 'failed', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  assignedAgentId: z.string().uuid().nullable(),
  createdBy: z.string().min(2),
  summary: z.string().min(3),
  estimatedSteps: z.number().int().min(1),
  requiresApproval: z.boolean(),
  sensitiveActions: z.array(z.string()),
  requiredIntegrations: z.array(z.string()),
  requiredPermissions: z.array(z.string()),
  plan: z.array(missionPlanStepSchema),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// Reutiliza la misma forma para el identificador de misión en rutas.
export const missionIdParamsSchema = z.object({
  missionId: z.string().uuid(),
});
