import { z } from 'zod';

export const validateConnectionSchema = z.object({
  mode: z.enum(['mock', 'api', 'cli']).optional(),
});

const systemSettingSchema = z.object({
  settingKey: z.string().min(2).max(120),
  settingValue: z.any(),
  category: z.enum(['openclaw', 'mcp', 'security', 'ui', 'runtime']),
  isSensitive: z.boolean().default(false),
  description: z.string().min(4),
});

export const createSystemSettingSchema = systemSettingSchema;
export const updateSystemSettingSchema = systemSettingSchema;
export const updateSystemSettingVisibilitySchema = z.object({
  isSensitive: z.boolean(),
});
