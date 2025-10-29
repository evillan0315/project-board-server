// FilePath: src/planner/validator.ts
// Title: Zod schema validator for AI plan DTOs
// Reason: Ensure incoming plan objects from LLMs conform to Prisma FileAction and application contract.
import { z } from 'zod';
import { FileAction as PrismaFileAction } from '@prisma/client';
// import { FileActionLabel } from '@/common/constants/file-action-map'; // ← keep only if used elsewhere
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
export const PlanSchema = z.object({
  title: z.string().min(1, 'title is required'),
  summary: z.string().optional(),
  changes: z.array(FileChangeSchema).min(0),
});
export type FileChange = z.infer<typeof FileChangeSchema>;
export type Plan = z.infer<typeof PlanSchema>;
/**
 * Validate an arbitrary object and return a strongly-typed Plan.
 * Throws ZodError if validation fails.
 */
export function validatePlan(obj: unknown): Plan {
  return PlanSchema.parse(obj);
}
