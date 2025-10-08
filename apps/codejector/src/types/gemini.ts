export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  AUDIO_TRANSLATION = 'AUDIO_TRANSLATION',
  TEXT_TRANSLATION = 'TEXT_TRANSLATION',
  FILE_TRANSLATION = 'FILE_TRANSLATION',
  GITHUB_ACTION_GENERATION = 'GITHUB_ACTION_GENERATION',
}

// Interfaces for GeminiRequest
export interface GeminiRequest {
  id: string;
  createdAt: string;
  userId: string;
  conversationId: string | null;
  modelUsed: string;
  prompt: string | null;
  systemInstruction: string | null;
  requestType: RequestType;
  imageUrl: string | null;
  imageData: string | null;
  fileMimeType: string | null;
  fileData: string | null;
  files: any | null;
}

export interface CreateGeminiRequestDto {
  userId: string;
  conversationId?: string;
  modelUsed: string;
  prompt?: string;
  systemInstruction?: string;
  requestType?: RequestType;
  imageUrl?: string;
  imageData?: string;
  fileMimeType?: string;
  fileData?: string;
  files?: any;
}

export interface UpdateGeminiRequestDto
  extends Partial<CreateGeminiRequestDto> {}

export interface PaginationGeminiRequestQueryDto {
  page?: number;
  pageSize?: number;
  userId?: string;
  conversationId?: string;
  modelUsed?: string;
  prompt?: string;
  requestType?: RequestType;
  systemInstruction?: string;
  imageUrl?: string;
  imageData?: string;
  fileMimeType?: string;
  fileData?: string;
  files?: any;
}

export interface PaginationGeminiRequestResultDto {
  items: GeminiRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interfaces for GeminiResponse
export interface GeminiResponse {
  id: string;
  createdAt: string;
  requestId: string;
  title: string | null;
  responseText: string;
  finishReason: string | null;
  safetyRatings: any | null;
  tokenCount: number | null;
  projectRoot: string | null;
}

export interface CreateGeminiResponseDto {
  requestId: string;
  title?: string;
  responseText: string;
  finishReason?: string;
  safetyRatings?: any;
  tokenCount?: number;
  projectRoot?: string;
}

export interface UpdateGeminiResponseDto
  extends Partial<CreateGeminiResponseDto> {}

export interface PaginationGeminiResponseQueryDto {
  page?: number;
  pageSize?: number;
  requestId?: string;
  title?: string;
  responseText?: string;
  finishReason?: string;
  safetyRatings?: any;
  tokenCount?: number;
  projectRoot?: string;
}

export interface PaginationGeminiResponseResultDto {
  items: GeminiResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
