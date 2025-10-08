import { AlertColor } from '@mui/material';
// Import FileEntry specifically for ContextMenuItem
import {
  RequestType,
  LlmOutputFormat,
  LlmGeneratePayload,
  ModelResponse,
  FileChange,
} from './llm';
import { TerminalCommandResponse } from './terminal';

// =========================================================================
// AI Editor State Types
// =========================================================================

export interface AiEditorState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  uploadedFileData: string | null;
  uploadedFileName: string | null; // Name of the uploaded file/image
  uploadedFileMimeType: string | null;
  currentProjectPath: string | null;
  response: string | null; // AI's last raw response string
  loading: boolean;
  error: string | null;
  scanPathsInput: string; // Add scanPathsInput to the state
  lastLlmResponse: ModelResponse | null; // Stores the full structured response from LLM
  lastLlmGeneratePayload: LlmGeneratePayload | null; // Stores the last payload sent to generateCode
  lastLlmGeneratePayloadString: string | null;
  selectedChanges: Record<string, FileChange>; // Map of filePath to ProposedFileChange
  currentDiff: string | null; // The content of the diff for the currently viewed file
  diffFilePath: string | null; // The filePath of the file whose diff is currently displayed
  applyingChanges: boolean; // Indicates if apply changes operation is in progress
  appliedMessages: string[]; // Messages from the backend after applying changes
  gitInstructions: string[] | null; // Optional git commands from LLM response
  runningGitCommandIndex: number | null; // Index of the git command currently being executed
  commandExecutionOutput: TerminalCommandResponse | null; // Output from the last git command execution
  commandExecutionError: string | null; // Error from the last git command execution
  openedFile: string | null; // Path of the file currently opened in the right editor panel
  openedFileContent: string | null; // Content of the file currently opened
  initialFileContentSnapshot: string | null; // Snapshot of file content when opened
  isFetchingFileContent: boolean; // Loading state for fetching opened file content
  fetchFileContentError: string | null; // Error state for fetching opened file content
  isSavingFileContent: boolean; // Loading state for saving opened file content
  saveFileContentError: string | null; // Error state for saving opened file content
  isOpenedFileDirty: boolean; // Indicates if opened file content has unsaved changes
  autoApplyChanges: boolean; // Automatically apply changes after generation
  isBuilding: boolean; // Indicates if a build process is running
  buildOutput: TerminalCommandResponse | null; // Output from the last build command
  openedTabs: string[]; // List of file paths currently opened as tabs
  snackbar: {
    open: boolean;
    message: string;
    severity: AlertColor | undefined;
  }; // Global snackbar state
}

// =========================================================================
// Gemini Live Audio Types
// =========================================================================

/**
 * Represents server-side content within a LiveMessageDto.
 */
export interface LiveServerContentDto {
  turnComplete?: boolean;
}

/**
 * DTO for a single message part in a live session turn.
 */
export interface LiveMessageDto {
  text?: string | null;
  data?: string | null; // Base64 encoded audio or other inline data
  serverContent?: LiveServerContentDto | null;
}

/**
 * DTO representing the complete result of a turn from Gemini (from AI to client).
 */
export interface LiveTurnResultDto {
  messages: LiveMessageDto[];
  texts: string[];
  datas: any[]; // Raw data contents (may contain audio or inline data)
}

/**
 * DTO for configuration settings for a new live session.
 */
export interface LiveConfigDto {
  model?: string;
}

/**
 * DTO for options when connecting to a new live session.
 */
export interface LiveConnectOptionsDto {
  config?: LiveConfigDto;
  initialText?: string;
}

/**
 * DTO for the response containing the new session ID after a session has been successfully started.
 */
export interface LiveSessionResponseDto {
  sessionId: string;
}

/**
 * DTO for sending text input to an active live session.
 */
export interface LiveTextInputDto {
  sessionId: string;
  text: string;
}

/**
 * DTO for sending base64-encoded audio chunks to an active live session.
 */
export interface LiveAudioInputDto {
  sessionId: string;
  audioChunk: string; // Base64 encoded audio chunk
  mimeType: string;
}

/**
 * DTO for explicitly signaling the end of user input for a turn and requesting an AI response.
 */
export interface ProcessTurnDto {
  sessionId: string;
}

/**
 * DTO for ending an active live session.
 */
export interface LiveEndSessionDto {
  sessionId: string;
}

// Gemini Live Audio Store State
export interface GeminiLiveAudioState {
  sessionId: string | null;
  isSessionActive: boolean;
  isRecording: boolean;
  microphonePermissionGranted: boolean;
  userTranscript: string; // Accumulate transcription if client-side or from backend
  aiResponseText: string; // Accumulate AI's text responses
  aiResponseAudioQueue: string[]; // Queue of Base64 audio data URLs for playback
  currentInputText: string; // For initial text prompt or direct text input
  loading: boolean; // General loading state for session actions or turns
  error: string | null;
}
