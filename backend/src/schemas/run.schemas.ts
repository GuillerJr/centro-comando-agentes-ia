import { z } from 'zod';

export const runIdParamsSchema = z.object({ runId: z.string().uuid() });
