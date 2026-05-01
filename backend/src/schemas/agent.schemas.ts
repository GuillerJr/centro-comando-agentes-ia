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
  communicationChannel: z.string().max(255).nullable().optional(),
  communicationChannelType: z.string().max(40).nullable().optional(),
  communicationProvider: z.string().max(40).nullable().optional(),
  communicationTarget: z.string().max(255).nullable().optional(),
  communicationMode: z.string().max(40).nullable().optional(),
  communicationIsDedicated: z.boolean().optional().default(false),
  communicationReplyPolicy: z.string().max(40).nullable().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export const updateAgentSchema = createAgentSchema;
export const updateAgentStatusSchema = z.object({ status: z.enum(['active', 'inactive', 'error', 'maintenance']) });
export const testAgentCommunicationSchema = z.object({ message: z.string().min(1).max(1000), initiatedBy: z.string().min(2).max(120).default('Mission Control') });
