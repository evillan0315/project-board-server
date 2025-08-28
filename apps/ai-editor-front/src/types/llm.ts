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
  additionalInstructions: string;
  expectedOutputFormat: string;
  scanPaths: string[];
}

export enum FileAction {
  ADD = 'add',
  MODIFY = 'modify',
  DELETE = 'delete',
}

export interface ProposedFileChange {
  filePath: string;
  action: FileAction;
  newContent?: string;
  reason?: string;
}

export interface LlmResponse {
  summary: string;
  thoughtProcess?: string;
  changes: ProposedFileChange[];
}
