import { z } from 'zod';

const FileAction = z.enum(['add','modify','delete']);
export const FileChangeSchema = z.object({
  filePath: z.string().min(1),
  action: FileAction,
  newContent: z.string().optional(),
  diff: z.string().optional(),
  reason: z.string().optional(),
});

export const PlanSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  changes: z.array(FileChangeSchema).min(0),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export function validatePlan(obj: unknown) {
  return PlanSchema.parse(obj);
}
