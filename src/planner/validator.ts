// FilePath: src/planner/validator.ts
// Title: Zod schema validator for AI plan DTOs
// Reason: Ensure incoming plan objects from LLMs conform to Prisma FileAction and application contract.
import { z } from 'zod';
import { FileAction as PrismaFileAction } from '@prisma/client';

/**
 * Map Zod enum directly to Prisma FileAction enum
 * to avoid case-mismatch errors (e.g., "modify" vs "MODIFY").
 */
const FileActionEnum = z.nativeEnum(PrismaFileAction);

export const FileChangeSchema = z.object({
  filePath: z.string().min(1, 'filePath is required'),
  action: FileActionEnum,
  newContent: z.string().optional(),
  diff: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * Schema for validating the raw output from the LLM.
 * This corresponds to the `GeneratedPlanDto`.
 */
export const GeneratedPlanSchema = z.object({
  title: z.string().min(1, 'title is required'),
  summary: z.string().optional(),
  thoughtProcess: z.string().optional(),
  documentation: z.string().optional(), // LLM outputs content as a string directly
  gitInstructions: z.array(z.string()).optional(),
  changes: z.array(FileChangeSchema).min(0),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

/**
 * Validate an arbitrary object against the GeneratedPlanSchema and return a strongly-typed GeneratedPlan.
 * Throws ZodError if validation fails.
 */
export function validatePlan(obj: unknown): GeneratedPlan {
  return GeneratedPlanSchema.parse(obj);
}
