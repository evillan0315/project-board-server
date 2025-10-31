import { FileAction as PrismaFileAction } from '@prisma/client';

// Frontend-friendly representation of FileAction
export type FileActionType = 'ADD' | 'MODIFY' | 'DELETE' | 'REPAIR' | 'ANALYZE' | 'INSTALL' | 'RUN';

export interface FileChange {
  filePath: string;
  action: FileActionType; // Use frontend-friendly type
  newContent?: string;
  diff?: string;
  reason?: string;
}

export interface Plan {
  planId?: string; // Optional for new plans, present for persisted ones
  title: string;
  summary?: string;
  thoughtProcess?: string;
  documentation?: string;
  gitInstructions?: string[];
  changes: FileChange[];
}

export interface LlmInput {
  userPrompt: string;
  projectStructure?: string;
  relevantFiles?: { relativePath: string; content: string }[];
  additionalInstructions?: string;
  scanPaths?: string[];
  requestType?: 'LLM_GENERATION' | 'TEXT_GENERATION';
}

export interface GeneratePlanResponse {
  planId: string;
  plan: Plan;
}

export interface ApplyPlanResult {
  ok: boolean;
  error?: string;
  details?: string;
  snapshot?: string;
  newHead?: string;
  results?: any[];
}
