import { z } from 'zod';

export const taskIdParamsSchema = z.object({ taskId: z.string().uuid() });

export const createTaskSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  taskType: z.enum(['frontend', 'backend', 'database', 'mcp', 'fullstack', 'infrastructure', 'documentation']),
  leadSkillId: z.string().uuid().nullable().optional(),
  supportSkillIds: z.array(z.string().uuid()).default([]),
  status: z.enum(['draft', 'pending', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled']).default('draft'),
  resultSummary: z.string().optional().nullable(),
  logs: z.string().optional().nullable(),
  createdBy: z.string().min(2).max(120).default('operator'),
  metadata: z.record(z.any()).optional().default({}),
});

export const updateTaskSchema = createTaskSchema.extend({
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

export const runTaskSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  requestedAction: z.string().min(3),
  skillIds: z.array(z.string().uuid()).default([]),
  executionMode: z.enum(['mock', 'api', 'cli']).optional(),
});
