import { RequestType } from './backend-enums'; // Assume this enum is available or create a local one

// Assuming a simplified RequestType for frontend for now, or fetch from backend constants.
// In a real app, you'd likely generate this from your NestJS enums.
export enum FileAction {
  ADD = 'ADD',
  MODIFY = 'MODIFY',
  DELETE = 'DELETE',
  REPAIR = 'REPAIR',
  ANALYZE = 'ANALYZE',
  INSTALL = 'INSTALL',
  RUN = 'RUN',
}

export interface IFileChange {
  filePath: string;
  action: FileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

export interface IPlan {
  planId?: string; // Added for when plan is persisted
  title: string;
  summary?: string; // Made optional as LLMs might not always provide
  thoughtProcess?: string;
  documentation?: string;
  gitInstructions?: string[];
  changes: IFileChange[];
}

export interface IPlanResponse {
  planId: string;
  plan: IPlan;
}

export interface ILlmInputDto {
  userPrompt: string;
  projectRoot?: string;
  scanPaths?: string[];
  additionalInstructions?: string;
  expectedOutputFormat: string;
  requestType: RequestType; // Assuming RequestType is defined as per backend
}

// For now, let's define a minimal RequestType here if not generated
// In a real project, this would be auto-generated from backend NestJS enums.
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LLM_CODE_ANALYSIS = 'LLM_CODE_ANALYSIS',
  LLM_CODE_OPTIMIZATION = 'LLM_CODE_OPTIMIZATION',
  LLM_CODE_REPAIR = 'LLM_CODE_REPAIR',
  LLM_CODE_DOCUMENTATION = 'LLM_CODE_DOCUMENTATION',
  LLM_ERROR_REPORTING = 'LLM_ERROR_REPORTING',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  AUDIO_GENERATION = 'AUDIO_GENERATION',
  TEXT_TO_SPEECH = 'TEXT_TO_SPEECH',
  SPEECH_TO_TEXT = 'SPEECH_TO_TEXT',
  VOICE_COMMAND = 'VOICE_COMMAND',
  AUDIO_TRANSCRIPTION = 'AUDIO_TRANSCRIPTION',
  ERROR_ANALYSIS = 'ERROR_ANALYSIS',
  REFACTOR = 'REFACTOR',
  IMAGE_CAPTIONING = 'IMAGE_CAPTIONING',
  SCREENSHOT_ANALYSIS = 'SCREENSHOT_ANALYSIS',
  WEB_SCRAPE_ANALYSIS = 'WEB_SCRAPE_ANALYSIS',
  OTHER = 'OTHER',
  PLAYWRIGHT_TASK_ANALYSIS = 'PLAYWRIGHT_TASK_ANALYSIS',
}