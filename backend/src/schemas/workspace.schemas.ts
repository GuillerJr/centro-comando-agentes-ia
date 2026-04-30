import { z } from 'zod';

// Valida la creación base de un workspace con su primer responsable.
export const createWorkspaceSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(3),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
});
