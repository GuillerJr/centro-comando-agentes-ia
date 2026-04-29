import { z } from 'zod';

const mcpServerSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  transportType: z.enum(['stdio', 'http', 'websocket']),
  endpoint: z.string().url().optional().nullable(),
  status: z.enum(['connected', 'disconnected', 'error', 'maintenance']).default('disconnected'),
  permissions: z.array(z.string()).default([]),
  allowedActions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export const createMcpServerSchema = mcpServerSchema;
export const updateMcpServerSchema = mcpServerSchema;
export const updateMcpServerStatusSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'error', 'maintenance']),
});
