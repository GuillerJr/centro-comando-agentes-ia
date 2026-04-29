import { z } from 'zod';

export const approvalIdParamsSchema = z.object({ approvalId: z.string().uuid() });

export const createApprovalSchema = z.object({
  taskId: z.string().uuid().nullable().optional(),
  runId: z.string().uuid().nullable().optional(),
  approvalType: z.enum(['system_command', 'sensitive_file_change', 'delete_file', 'config_change', 'database_change', 'migration', 'mcp_write']),
  reason: z.string().min(10),
  requestedBy: z.string().min(2).max(120),
  payloadSummary: z.record(z.any()).optional().default({}),
});

export const reviewApprovalSchema = z.object({
  reviewedBy: z.string().min(2).max(120),
  executionNotes: z.string().max(500).optional().nullable(),
});

export const executeApprovalSchema = z.object({
  reviewedBy: z.string().min(2).max(120),
  executionNotes: z.string().max(500).optional().nullable(),
});
