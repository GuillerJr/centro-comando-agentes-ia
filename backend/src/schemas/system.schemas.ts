import { z } from 'zod';

export const validateConnectionSchema = z.object({
  mode: z.enum(['mock', 'api', 'cli']).optional(),
});
