export const APP_NAME = 'Project Board';
export const APP_DESCRIPTION =
  'Your AI-Powered Development Partner to manage and build projects.';
export const APP_VERSION = '1.0.0';
export const APP_URL = 'http://localhost:3001';

// ---------------- TypeScript Types ----------------

export type FileAction = 'add' | 'modify' | 'delete' | 'repair' | 'analyze';

export interface FileChangeBase {
  filePath: string; // Path relative to project root
  action: FileAction; // Type of change
  reason: string; // Required explanation
}

export interface AddOrModifyFileChange extends FileChangeBase {
  action: 'add' | 'modify' | 'repair';
  newContent: string; // Full file content (required)
}

export interface DeleteOrAnalyzeFileChange extends FileChangeBase {
  action: 'delete' | 'analyze';
  newContent?: never; // Forbidden for delete/analyze
}

export type FileChange = AddOrModifyFileChange | DeleteOrAnalyzeFileChange;

export interface Documentation {
  purpose: string; // High-level purpose (e.g., Migration Guide)
  details: string; // Markdown-formatted content (must start with heading)
}

export interface ModelResponse {
  title: string; // Concise title of the change
  summary: string; // High-level explanation
  thoughtProcess: string; // Reasoning behind changes
  documentation?: Documentation; // Optional structured docs
  changes: FileChange[]; // List of file operations
  gitInstructions?: string[]; // Optional git commands to execute after applying changes
}
export * from './instruction';
export * from './yaml-instruction';
export * from './markdown-instruction';
export * from './text-instruction';
