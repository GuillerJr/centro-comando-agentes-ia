import { z } from 'zod';

export const runIdParamsSchema = z.object({ runId: z.string().uuid() });

export const updateRunStatusSchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
  outputSummary: z.string().max(2000).optional().nullable(),
  errorMessage: z.string().max(2000).optional().nullable(),
});
