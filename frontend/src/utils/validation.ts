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
