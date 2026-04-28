import { z } from 'zod';

export const skillIdParamsSchema = z.object({ skillId: z.string().uuid() });

export const createSkillSchema = z.object({
  canonicalName: z.string().min(2).max(120),
  conversationalAlias: z.string().max(120).optional().nullable(),
  description: z.string().min(10),
  skillType: z.enum(['governance', 'architecture', 'frontend', 'backend', 'database', 'mcp', 'ui', 'fullstack', 'operations']),
  status: z.enum(['active', 'inactive', 'deprecated']).default('active'),
  whenToUse: z.string().min(10),
  whenNotToUse: z.string().min(10),
  relatedSkills: z.array(z.string()).default([]),
  qualityChecklist: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export const updateSkillSchema = createSkillSchema;
