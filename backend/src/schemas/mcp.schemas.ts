import { z } from 'zod';

export const createMcpServerSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  transportType: z.enum(['stdio', 'http', 'websocket']),
  endpoint: z.string().url().optional().nullable(),
  status: z.enum(['connected', 'disconnected', 'error', 'maintenance']).default('disconnected'),
  permissions: z.array(z.string()).default([]),
  allowedActions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional().default({}),
});
