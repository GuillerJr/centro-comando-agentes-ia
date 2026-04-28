import { z } from 'zod';

export const agentIdParamsSchema = z.object({ agentId: z.string().uuid() });

export const createAgentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  agentType: z.enum(['orchestrator', 'specialist', 'executor', 'observer', 'system']),
  status: z.enum(['active', 'inactive', 'error', 'maintenance']).default('active'),
  skillIds: z.array(z.string().uuid()).default([]),
  priority: z.number().int().min(1).max(100),
  executionLimit: z.number().int().min(1).max(100),
  metadata: z.record(z.any()).optional().default({}),
});

export const updateAgentSchema = createAgentSchema;
export const updateAgentStatusSchema = z.object({ status: z.enum(['active', 'inactive', 'error', 'maintenance']) });
