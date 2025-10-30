import { z } from 'zod';
import { FileAction as PrismaFileAction } from '../prisma/prisma.service';
import { CustomError } from '../common/errors';

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
  thoughtProcess: z.string().optional(),
  changes: z.array(FileChangeSchema).min(0),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
export type Plan = z.infer<typeof PlanSchema>;

/**
 * Validate an arbitrary object and return a strongly-typed Plan.
 * Throws CustomError if validation fails.
 */
export function validatePlan(obj: unknown): Plan {
  try {
    return PlanSchema.parse(obj);
  } catch (error: any) {
    const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new CustomError(`Plan validation failed: ${errorMessages}`, 400);
  }
}
