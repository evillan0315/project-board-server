// src/gemini/dto/gemini-live.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Note: Modality from '@google/genai' is no longer directly applicable to the REST API behavior.

/**
 * Represents server-side content within a LiveMessageDto.
 * (Input and output transcription fields are not available from the Gemini `generateContent` REST API).
 */
export class LiveServerContentDto {
  @ApiPropertyOptional({ description: 'Indicates if the AI turn is complete.' })
  @IsOptional()
  turnComplete?: boolean;
}

/**
 * DTO for a single message part in a live session turn.
 */
export class LiveMessageDto {
  @ApiPropertyOptional({ description: 'Text content of the message.' })
  @IsOptional()
  @IsString()
  text?: string | null; // allow null since service pushes null

  @ApiPropertyOptional({ description: 'Optional audio or inline data chunk.' })
  @IsOptional()
  data?: string | null; // explicitly included in service

  @ApiPropertyOptional({
    type: LiveServerContentDto,
    description: 'Server-side content, e.g., turn completion status.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LiveServerContentDto)
  serverContent?: LiveServerContentDto | null; // allow null for service alignment
}

/**
 * DTO representing the complete result of a turn from Gemini (from AI to client).
 */
export class LiveTurnResultDto {
  @ApiProperty({
    type: [LiveMessageDto],
    description: 'Array of messages received in this turn.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveMessageDto)
  messages: LiveMessageDto[];

  @ApiProperty({
    type: [String],
    description: 'Array of text contents extracted from the messages.',
  })
  @IsArray()
  @IsString({ each: true })
  texts: string[];

  @ApiProperty({
    type: [Object],
    description:
      'Array of raw data contents (may contain audio or inline data).',
  })
  @IsArray()
  datas: any[];
}

/**
 * DTO for configuration settings for a new live session.
 */
export class LiveConfigDto {
  @ApiPropertyOptional({
    description: 'The Gemini model to use (e.g., gemini-1.5-flash-latest).',
  })
  @IsOptional()
  @IsString()
  model?: string;
  // `responseModalities` is removed as the REST API implicitly returns text.
}

/**
 * DTO for options when connecting to a new live session.
 */
export class LiveConnectOptionsDto {
  @ApiPropertyOptional({
    type: LiveConfigDto,
    description: 'Configuration options for the session.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LiveConfigDto)
  config?: LiveConfigDto;

  @ApiPropertyOptional({
    description: 'Initial text to send when connecting the session.',
  })
  @IsOptional()
  @IsString()
  initialText?: string;
}

/**
 * Interface for audio payload chunks (primarily for internal service use to buffer audio).
 */
export interface LiveAudioPayloadDto {
  data: Uint8Array;
  mimeType: string;
}

/**
 * Internal service interface for managing conversation history structure for the Gemini REST API payload.
 */
export interface ConversationContent {
  role: 'user' | 'model'; // Roles must alternate
  parts: Array<{
    text?: string;
    inlineData?: { mime_type: string; data: string };
  }>;
}

/**
 * Internal service interface for managing the state and actions of a "live" session.
 * (This interface is used internally by `GoogleGeminiLiveService` and not directly exposed via HTTP/WebSocket DTOs).
 */
export interface LiveSessionHandleDto {
  conversationHistory: ConversationContent[];
  pendingUserTexts: string[];
  pendingAudioChunks: LiveAudioPayloadDto[];
  pendingAudioMimeType: string | null;
  sendText: (text: string) => Promise<void>;
  sendAudio: (payload: LiveAudioPayloadDto) => Promise<void>;
  close: () => void;
  waitForTurn: () => Promise<LiveTurnResultDto>;
}

// --- DTOs for Controller/Gateway Events (Input/Output) ---

/**
 * DTO for the response containing the new session ID after a session has been successfully started.
 */
export class LiveSessionResponseDto {
  @ApiProperty({ description: 'Unique ID for the established live session.' })
  @IsString()
  sessionId: string;
}

/**
 * DTO for sending text input to an active live session.
 */
export class LiveTextInputDto {
  @ApiProperty({ description: 'Unique ID of the live session.' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Text message from the user.' })
  @IsString()
  text: string;
}

/**
 * DTO for sending base64-encoded audio chunks to an active live session.
 */
export class LiveAudioInputDto {
  @ApiProperty({ description: 'Unique ID of the live session.' })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description:
      'Base64 encoded audio chunk. Each request should ideally contain one chunk.',
    format: 'byte', // Indicates binary string in Swagger
  })
  @IsString()
  audioChunk: string;

  @ApiProperty({
    description:
      'MIME type of the audio (e.g., audio/webm, audio/wav, audio/mpeg).',
  })
  @IsString()
  mimeType: string;
}

/**
 * DTO for explicitly signaling the end of user input for a turn and requesting an AI response.
 */
export class ProcessTurnDto {
  @ApiProperty({ description: 'Unique ID of the live session.' })
  @IsString()
  sessionId: string;
}

/**
 * DTO for ending an active live session.
 */
export class LiveEndSessionDto {
  @ApiProperty({ description: 'Unique ID of the live session to close.' })
  @IsString()
  sessionId: string;
}
