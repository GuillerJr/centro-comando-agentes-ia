import { z } from 'zod';

// Valida la creación base de un workspace con su primer responsable.
export const createWorkspaceSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(3),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
});

export const updateWorkspaceSchema = z.object({
  actorName: z.string().min(2).default('Guiller'),
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(3),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const createWorkspaceMembershipSchema = z.object({
  actorName: z.string().min(2).default('Guiller'),
  displayName: z.string().min(2),
  email: z.string().email(),
  roleKey: z.enum(['owner', 'admin', 'operator', 'viewer']),
});

export const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});
