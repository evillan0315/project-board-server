 // src/gemini/dto/gemini-live.dto.ts

// No longer importing these as decorators are removed.
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';

// Note: Modality from '@google/genai' is removed as it's not applicable to the REST API behavior.

/**
 * Interface for server-side content within a message, for REST API simulation.
 * (inputTranscription and outputTranscription are not available in REST API generateContent)
 */
export interface ILiveServerContentDto {
  turnComplete?: boolean;
}

/**
 * Interface for a single message in a live session turn (from AI to client).
 * Adapted for REST, as direct 'data' output and transcriptions won't be available from generateContent.
 */
export interface ILiveMessageDto {
  text?: string;
  serverContent?: ILiveServerContentDto;
}

/**
 * Interface for the result of a complete turn returned from Gemini (from AI to client).
 * datas array will always be empty for the REST API generateContent.
 */
export interface ILiveTurnResultDto {
  messages: ILiveMessageDto[];
  texts: string[];
  datas: any[]; // Will be empty for generateContent REST API as it doesn't return raw data directly.
}

/**
 * Interface for configuration options for a live session.
 */
export interface ILiveConfigDto {
  model?: string; // e.g., 'gemini-1.5-flash-latest'
  // responseModalities is removed as REST API implicitly returns text.
}

/**
 * Interface for options when connecting to a live session.
 */
export interface ILiveConnectOptionsDto {
  config?: ILiveConfigDto;
  initialText?: string;
}

/**
 * Interface for audio payload chunks (internal service use - not for direct API exposure).
 */
export interface LiveAudioPayloadDto {
  data: Uint8Array;
  mimeType: string;
}

/**
 * Internal service interface for managing conversation history for the Gemini REST API payload.
 */
export interface ConversationContent {
  role: 'user' | 'model'; // Roles must alternate
  parts: Array<{ text?: string; inlineData?: { mime_type: string; data: string } }>;
}

/**
 * Internal service interface for managing the state of a "live" session in the service.
 * (Not exposed directly via API).
 */
export interface LiveSessionHandleDto {
  conversationHistory: ConversationContent[];
  pendingUserTexts: string[];
  pendingAudioChunks: LiveAudioPayloadDto[];
  pendingAudioMimeType: string | null;
  sendText: (text: string) => Promise<void>;
  sendAudio: (payload: LiveAudioPayloadDto) => Promise<void>;
  close: () => void;
  waitForTurn: () => Promise<ILiveTurnResultDto>;
}

// --- DTOs for Controller/Gateway Events (interface versions) ---

/**
 * Interface for the response after a session has been successfully started.
 */
export interface ILiveSessionResponseDto {
  sessionId: string;
}

/**
 * Interface for sending text input to the session.
 */
export interface ILiveTextInputDto {
  sessionId: string;
  text: string;
}

/**
 * Interface for sending base64-encoded audio chunks to the session.
 */
export interface ILiveAudioInputDto {
  sessionId: string;
  audioChunk: string; // Base64 encoded audio chunk
  mimeType: string;
}

/**
 * Interface for explicitly signaling the end of user input for a turn and requesting AI response.
 */
export interface IProcessTurnDto {
  sessionId: string;
}

/**
 * Interface for ending a live session.
 */
export interface ILiveEndSessionDto {
  sessionId: string;
}
