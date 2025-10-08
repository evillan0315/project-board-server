import { TerminalCommandResponse } from './terminal';
// =========================================================================
// AI/LLM Related Types
// =========================================================================
export enum LLM_ENDPOINT {
  SCHEMA_GENERATOR = '/schema/generator',
}

export interface SchemaResponse {
  schema: string;
}
// Request Types
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_MODIFICATION = 'CODE_MODIFICATION',
  CODE_REPAIR = 'CODE_REPAIR',
  CODE_ANALYSIS = 'CODE_ANALYSIS',
}
// LLM Output Formats
export enum LlmOutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  TEXT = 'text',
}
// File Actions for AI-generated changes
export enum FileAction {
  ADD = 'add',
  MODIFY = 'modify',
  DELETE = 'delete',
  REPAIR = 'repair',
  ANALYZE = 'analyze',
}

// Base interface for file changes
export interface BaseFileChange {
  filePath: string; // Absolute path to the file
  reason?: string;
  action: FileAction;
}

// Specific types for different file change actions
export interface AddOrModifyFileChange extends BaseFileChange {
  action: FileAction.ADD | FileAction.MODIFY | FileAction.REPAIR;
  newContent: string;
}

export interface DeleteOrAnalyzeFileChange extends BaseFileChange {
  action: FileAction.DELETE | FileAction.ANALYZE;
  newContent?: never; // Delete and analyze actions don't have new content
}

// Union type for all possible file changes
export type FileChange = AddOrModifyFileChange | DeleteOrAnalyzeFileChange;

// Model Response structure from LLM
export interface ModelResponse {
  title?: string;
  summary: string;
  thoughtProcess?: string;
  changes: FileChange[];
  gitInstructions?: string[];
  documentation?: string;
  requestType: RequestType;
  outputFormat: LlmOutputFormat;
  rawResponse?: string; // For debugging or display of raw LLM output
  error?: string; // If the LLM itself reports an error in its structured response
  buildScript?: string; // Optional build script from LLM response
}

export const RequestTypeValues = Object.values(RequestType);

export const LlmOutputFormatValues = Object.values(LlmOutputFormat);

// LLM Payload and Context Types
export interface LlmRelevantFile {
  filePath: string;
  relativePath: string;
  content: string;
}

export interface LlmGeneratePayload {
  userPrompt: string;
  projectRoot: string;
  projectStructure: string;
  relevantFiles: LlmRelevantFile[];
  additionalInstructions: string; // Corresponds to `systemInstruction` in GeminiRequest
  expectedOutputFormat: string;
  scanPaths: string[];
  requestType: RequestType;
  imageData?: string; // Base64 image data
  fileData?: string; // Base64 file data
  fileMimeType?: string; // Mime type of the uploaded file/image
  output?: LlmOutputFormat; // Desired output format for the LLM response
  conversationId?: string;
}

export interface LlmReportErrorPayload {
  error: string; // The error message
  errorDetails?: string; // Additional details like stack trace or stderr
  originalRequestType?: RequestType; // Original request type that led to the build
  previousLlmResponse?: ModelResponse | null; // The LLM response that resulted in changes
  originalLlmGeneratePayload?: LlmGeneratePayload | null; // The original payload that generated the previousLlmResponse
  projectRoot: string;
  scanPaths: string[];
  buildOutput?: TerminalCommandResponse | null; // The full output of the failed build command
}

export interface LlmReportErrorContext {
  originalUserPrompt?: string; // From originalLlmGeneratePayload.userPrompt
  systemInstruction?: string; // From originalLlmGeneratePayload.additionalInstructions
  failedChanges?: FileChange[]; // From previousLlmResponse.changes
  originalFilePaths?: string[]; // Derived from failedChanges.filePath
}

export interface LlmReportErrorApiPayload {
  errorDetails: string;
  projectRoot: string;
  context: LlmReportErrorContext;
  scanPaths?: string[];
}
