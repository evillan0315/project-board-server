import { ProposedFileChange } from './llm';
import { LlmResponse } from './llm';

export interface FileEntry {
  name: string;
  filePath: string; // Changed from 'path' to 'filePath'
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
}

export interface FileContentResponse {
  content: string;
  filePath: string;
}

export interface AiEditorState {
  instruction: string;
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  error: string | null;
  scanPathsInput: string; // Add scanPathsInput to the state
  lastLlmResponse: LlmResponse | null; // Stores the full structured response from LLM
  selectedChanges: Record<string, ProposedFileChange>; // Map of filePath to ProposedFileChange
  currentDiff: string | null; // The content of the diff for the currently viewed file
  diffFilePath: string | null; // The filePath of the file whose diff is currently displayed
  applyingChanges: boolean; // Indicates if apply changes operation is in progress
  appliedMessages: string[]; // Messages from the backend after applying changes
}
