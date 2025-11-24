// FIlePath: src/planner/validator.ts
// Title: Zod schema validator for AI plan DTOs with ExecutorService alignment (DTO-driven)
// Reason: Use GeneratedPlanDto / FileChangeDto as the canonical DTO shapes and provide Zod validation + normalization suitable for persisting.

import { z } from 'zod';
import * as path from 'path';
import { FileAction as PrismaFileAction } from '@prisma/client';

// Import DTOs for clarity / alignment (used for typing and keeping naming consistent)
import { GeneratedPlanDto, FileChangeDto } from './dto/create-planner.dto'; // adjust path if needed

// Build case-insensitive lookup for the Prisma enum values
const prismaActions = Object.values(PrismaFileAction).filter(
  (v) => typeof v === 'string',
) as string[];
const actionLookup = new Map<string, string>();
for (const v of prismaActions) actionLookup.set(String(v).toLowerCase(), v);

// Synonyms mapping tuned to your Prisma enum values
const synonyms: Record<string, string> = {
  add: actionLookup.get('add') ?? 'ADD',
  create: actionLookup.get('add') ?? 'ADD',

  modify: actionLookup.get('modify') ?? 'MODIFY',
  update: actionLookup.get('modify') ?? 'MODIFY',

  delete: actionLookup.get('delete') ?? 'DELETE',
  remove: actionLookup.get('delete') ?? 'DELETE',

  repair: actionLookup.get('repair') ?? 'REPAIR',

  analyze: actionLookup.get('analyze') ?? 'ANALYZE',
  analyse: actionLookup.get('analyze') ?? 'ANALYZE',

  install: actionLookup.get('install') ?? 'INSTALL',

  run: actionLookup.get('run') ?? 'RUN',
  execute: actionLookup.get('run') ?? 'RUN',
};

/**
 * Small helper: ensure provided path is a safe relative path (no leading slash or '..').
 * This is a lightweight guard; final resolution should use ExecutorService.resolveChangePath.
 */
const safeRelativePath = z
  .string()
  .min(1, 'filePath is required')
  .refine((p) => {
    console.log(p, 'safeRelativePath');
    if (!p) return false;
    if (/^[\\/]/.test(p)) return false; // leading separator
    if (p.split(/[\\/]+/).includes('..')) return false; // parent traversal
    if (/^[a-zA-Z]:[\\/]/.test(p)) return false; // windows root like C:\
    const normalized = path.posix.normalize(p.replace(/\\/g, '/'));
    if (normalized.startsWith('..')) return false;
    return true;
  }, 'filePath must be a relative path with no parent-traversal or leading separators');

/**
 * Coerce ISO strings/numeric timestamps to Date objects for Zod validation.
 */
const OptionalDate = z.preprocess((val) => {
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val as any);
    if (!isNaN(d.getTime())) return d;
  }
  return val;
}, z.date().optional());

/**
 * FileAction preprocessing: accept strings (case-insensitive + synonyms) and map to
 * canonical Prisma enum string (e.g., 'ADD','MODIFY', ...). Validate using z.nativeEnum.
 */
const FileActionNative = z.nativeEnum(PrismaFileAction);
const FileActionSchema = z.preprocess((input) => {
  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    if (actionLookup.has(lower)) return actionLookup.get(lower);
    if (synonyms[lower]) return synonyms[lower];
    const match = prismaActions.find((a) => a.toLowerCase() === lower);
    if (match) return match;
    return input; // let z.nativeEnum produce the error if it's unknown
  }
  return input;
}, FileActionNative);

/**
 * Align FileChange schema to FileChangeDto fields:
 * - filePath: safe relative path
 * - action: enum (mapped/coerced)
 * - newContent/diff/oldContent/reason: optional nullable strings
 * - testsAdded: optional array of strings
 * - estimatedMinutes: optional non-negative integer
 */
export const FileChangeSchema = z.object({
  filePath: safeRelativePath,
  action: FileActionSchema,
  newContent: z.string().nullable().optional(),
  diff: z.string().nullable().optional(),
  oldContent: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  testsAdded: z.array(z.string()).nullable().optional(),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
  index: z.number().int().optional().nullable(),
});

/**
 * Reusable union for thoughtProcess/assumptions matching DTO which allows string | string[]
 */
const StringOrStringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .nullable();

/**
 * GeneratedPlan schema aligned with GeneratedPlanDto fields.
 * Keeps optional/nullability consistent with DTO.
 */
export const GeneratedPlanSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'title is required'),
  summary: z.string().optional().nullable(),
  thoughtProcess: StringOrStringArray,
  assumptions: StringOrStringArray,
  confidence: z.number().min(0).max(1).optional().nullable(),
  estimatedEffortMinutes: z.number().int().min(0).optional().nullable(),
  documentation: z.string().optional().nullable(),
  documentationId: z.string().optional().nullable(),
  changes: z.array(FileChangeSchema).min(0),
  metadata: z.record(z.string(), z.any()).optional(),
  projectRoot: z.string().optional().nullable(),
  lastExecutionStatus: z.string().optional().nullable(),
  lastExecutionError: z.string().optional().nullable(),
  lastExecutionTimestamp: OptionalDate,
  error: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  llmInput: z.any().optional(),
  createdAt: OptionalDate,
  updatedAt: OptionalDate,
});

/**
 * Types exported for use elsewhere (keeps parity with DTO naming)
 */
export type FileChange = z.infer<typeof FileChangeSchema>;

export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

/**
 * Validate an object against the GeneratedPlanSchema.
 * Throws ZodError on invalid plan objects.
 */
export function validatePlan(obj: unknown): GeneratedPlan {
  return GeneratedPlanSchema.parse(obj);
}

/**
 * normalizeAndValidatePlan:
 * - Accepts a loose LLM-provided object
 * - Normalizes common fields (lowercase action mapping already handled by z.preprocess)
 * - Ensures thoughtProcess/assumptions remain as provided (string or string[])
 * - Coerces dates where possible
 * - Returns the parsed & typed GeneratedPlan suitable for persisting/mapping to GeneratedPlanDto
 *
 * This keeps DTO field names and expectations intact while using Zod to coerce and validate.
 */
export function normalizeAndValidatePlan(obj: unknown): GeneratedPlan {
  // Zod preprocessors already handle action and date coercion.
  // Here we provide small additional normalization: trim strings and ensure changes array exists.
  const normalizedInput = ((): unknown => {
    if (!obj || typeof obj !== 'object') return obj;
    const o = { ...(obj as Record<string, any>) };

    // Ensure changes is at least an empty array if missing
    if (!Array.isArray(o.changes)) o.changes = [];

    // Trim title/summary/documentation/errors if present
    if (typeof o.title === 'string') o.title = o.title.trim();
    if (typeof o.summary === 'string') o.summary = o.summary.trim();
    if (typeof o.documentation === 'string')
      o.documentation = o.documentation.trim();
    if (typeof o.error === 'string') o.error = o.error.trim();

    // Normalize each change minimally (ensure filePath exists)
    o.changes = (o.changes || []).map((c: any, idx: number) => {
      const change = { ...(c || {}) };
      if (!change.filePath && typeof change.filePath !== 'string') {
        change.filePath = `unnamed-${idx}.txt`;
      } else if (typeof change.filePath === 'string') {
        change.filePath = change.filePath.trim();
      }
      // allow index from DTO
      if (typeof change.index !== 'number') change.index = idx;
      return change;
    });

    return o;
  })();

  return GeneratedPlanSchema.parse(normalizedInput);
}
