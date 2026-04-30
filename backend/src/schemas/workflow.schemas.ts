import { z } from 'zod';

// Define la forma mínima de un paso reutilizable dentro de una plantilla.
const workflowStepSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  sensitive: z.boolean().default(false),
});

// Valida la creación de una plantilla operativa reutilizable.
export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  objective: z.string().min(3),
  defaultPriority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  recommendedSandbox: z.boolean().default(true),
  steps: z.array(workflowStepSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// Reutiliza identificadores para operaciones sobre una plantilla concreta.
export const workflowIdParamsSchema = z.object({
  workflowId: z.string().uuid(),
});

// Permite lanzar una misión a partir de una plantilla ya definida.
export const launchWorkflowSchema = z.object({
  createdBy: z.string().min(2).default('Guiller'),
  sandbox: z.boolean().default(true),
  workspaceId: z.string().uuid().optional(),
});
