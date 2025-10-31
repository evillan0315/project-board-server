/**
 * Frontend types for the AI Planner feature.
 * Aligns with backend DTOs and Prisma enums to ensure type safety.
 */

// Replicate backend enums as string unions to avoid direct Prisma dependency
export type FileAction =
  'ADD' | 'MODIFY' | 'DELETE' | 'REPAIR' | 'ANALYZE' | 'INSTALL' | 'RUN';

export type RequestType =
  'TEXT_ONLY' | 'TEXT_WITH_IMAGE' | 'TEXT_WITH_FILE' | 'LLM_GENERATION' |
  'LLM_CODE_ANALYSIS' | 'LLM_CODE_OPTIMIZATION' | 'LLM_CODE_REPAIR' |
  'LLM_CODE_DOCUMENTATION' | 'LLM_ERROR_REPORTING' | 'LIVE_API' |
  'RESUME_GENERATION' | 'RESUME_OPTIMIZATION' | 'RESUME_ENHANCEMENT' |
  'VIDEO_GENERATION' | 'IMAGE_GENERATION' | 'AUDIO_GENERATION' |
  'TEXT_TO_SPEECH' | 'SPEECH_TO_TEXT' | 'VOICE_COMMAND' |
  'AUDIO_TRANSCRIPTION' | 'ERROR_ANALYSIS' | 'REFACTOR' |
  'IMAGE_CAPTIONING' | 'SCREENSHOT_ANALYSIS' | 'WEB_SCRAPE_ANALYSIS' |
  'OTHER' | 'PLAYWRIGHT_TASK_ANALYSIS';

export type LlmOutputFormat =
  'JSON' | 'TEXT' | 'MARKDOWN' | 'YAML' | 'JAVASCRIPT' | 'TYPESCRIPT' |
  'PYTHON' | 'GO' | 'JAVA' | 'CPP' | 'C' | 'CSHARP' | 'PHP' | 'RUBY' |
  'RUST' | 'HTML' | 'CSS' | 'SQL' | 'XML' | 'SHELL' | 'DIFF' | 'PRISMA_SCHEMA';

// Frontend DTOs and Interfaces

/**
 * Represents a scanned file with its path and content, used for LLM context.
 */
export interface IScannedFile {
  filePath: string;
  relativePath: string;
  content: string;
}

/**
 * Interface representing the input for LLM generation requests.
 * Mirrors the essential parts of the backend's LlmInputDto.
 */
export interface ILlmInput {
  userPrompt: string;
  projectRoot?: string;
  projectStructure?: string;
  relevantFiles?: IScannedFile[];
  additionalInstructions?: string;
  expectedOutputFormat: string; // The LLM needs to know how to format its output
  scanPaths?: string[];
  requestType: RequestType; // e.g., 'LLM_GENERATION'
  output?: LlmOutputFormat; // e.g., 'JSON'
  fileData?: string; // Base64 encoded file content
  fileMimeType?: string;
}

/**
 * Represents a single file change proposed in a plan.
 * Aligns with backend's FileChangeDto.
 */
export interface IFileChange {
  filePath: string;
  action: FileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

/**
 * Represents a complete AI-generated plan entity as stored in the backend.
 * Aligns with the backend's PlanDto (persisted entity).
 */
export interface IPlan {
  id: string;
  title: string;
  summary?: string;
  thoughtProcess?: string;
  documentation?: string; // The content of the linked Documentation entity
  documentationId?: string; // ID of the linked Documentation entity
  gitInstructions?: string[];
  llmInput?: ILlmInput; // The input that generated this plan
  createdAt: Date;
  updatedAt?: Date;
  lastExecutionStatus?: string;
  lastExecutionError?: string; // Detailed error message if execution failed
  lastExecutionTimestamp?: Date;
  createdById?: string; // ID of the User who created the plan
  changes: IFileChange[];
}

/**
 * Response structure for generating a new plan from the API.
 */
export interface IGeneratePlanResponse {
  planId: string;
  plan: IPlan;
}

/**
 * Result structure after applying a plan via the API.
 */
export interface IApplyPlanResult {
  ok: boolean;
  error?: string;
  details?: string;
  snapshot?: string; // Git commit hash of the snapshot taken before applying changes
  newHead?: string; // Git commit hash after applying changes
  results?: any[]; // Detailed results of each change application (e.g., file: 'x', ok: true)
}
