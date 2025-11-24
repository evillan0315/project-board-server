// FIlePath: src/planner/validator.ts
// Title: Zod schema validator for AI plan DTOs with ExecutorService alignment
// Reason: Ensure plan objects from LLMs conform to DTOs and file operations expected by ExecutorService

import { z } from 'zod';
import { FileAction as PrismaFileAction } from '@prisma/client';

// Map Prisma enum to Zod enum
const FileActionEnum = z.nativeEnum(PrismaFileAction);

export const FileChangeSchema = z.object({
  filePath: z.string().min(1, 'filePath is required'),
  action: FileActionEnum,
  newContent: z.string().optional().nullable(),
  diff: z.string().optional().nullable(),
  oldContent: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  testsAdded: z.array(z.string()).optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional(),
});

export const TestsSchema = z.object({
  add: z.array(z.string()).optional(),
  modify: z.array(z.string()).optional(),
});

export const GeneratedPlanSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'title is required'),
  summary: z.string().optional(),
  thoughtProcess: z.union([z.string(), z.array(z.string())]).optional(),
  assumptions: z.union([z.string(), z.array(z.string())]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  estimatedEffortMinutes: z.number().int().min(0).optional(),
  documentation: z.string().optional(),
  documentationId: z.string().optional(),
  changes: z.array(FileChangeSchema).min(0),
  tests: TestsSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  projectRoot: z.string().optional().nullable(),
  lastExecutionStatus: z.string().optional().nullable(),
  lastExecutionError: z.string().optional().nullable(),
  lastExecutionTimestamp: z.date().optional(),
  error: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  llmInput: z.any().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
export type Tests = z.infer<typeof TestsSchema>;
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

/**
 * Validate an object against the GeneratedPlanSchema.
 * Throws ZodError on invalid plan objects.
 */
export function validatePlan(obj: unknown): GeneratedPlan {
  return GeneratedPlanSchema.parse(obj);
}

