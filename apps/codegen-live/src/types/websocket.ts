/**
 * This file defines the WebSocket DTOs (Data Transfer Objects)
 * used for communication between the frontend and the NestJS backend's
 * Gemini Live WebSocket Gateway.
 *
 * The interfaces are named and structured to align directly with the
 * DTOs defined in the backend at `src/google/google-gemini-live/dto/gemini-live.dto.ts`.
 */

// ------------ Client to Server DTOs (Outbound) ------------

/**
 * DTO for initiating or resuming a live Gemini session.
 * Corresponds to backend's `StartLiveSessionDto`.
 */
export interface StartLiveSessionDto {
  /**
   * An optional initial prompt to send to Gemini when starting a new session.
   */
  initialPrompt?: string;
  /**
   * The ID of an existing conversation to resume. If not provided, a new session ID will be generated.
   */
  conversationId?: string;
  /**
   * Optional array of modalities (e.g., 'TEXT', 'AUDIO') the session should support.
   */
  modalities?: string[];
}

/**
 * DTO for sending audio chunks from the client to Gemini.
 * Corresponds to backend's `AudioInputDto`.
 */
export interface AudioInputDto {
  /**
   * Base64 encoded audio data chunk.
   */
  audioChunk: string;
  /**
   * MIME type of the audio input (e.g., 'audio/webm;codecs=opus', 'audio/wav').
   */
  mimeType: string;
  /**
   * The ID of the current conversation session.
   */
  conversationId: string; // Explicitly add this to payload as per backend usage in service/gateway
}

/**
 * DTO for sending a generic message (text and/or audio) to Gemini.
 * Corresponds to backend's `MessageDto`.
 */
export interface MessageDto {
  /**
   * The ID of the current conversation session.
   */
  conversationId: string;
  /**
   * Optional text message content.
   */
  text?: string;
  /**
   * Optional Base64-encoded audio data. Used for sending audio via the generic message event.
   */
  audioBase64?: string;
}

// ------------ Server to Client DTOs (Inbound) ------------

/**
 * DTO for AI responses received from the backend on the `aiResponse` WebSocket event.
 * This directly corresponds to the backend's `AiResponseDto`.
 */
export interface AiResponseDto {
  /**
   * The type of AI response received.
   * - `text`: AI's text response content.
   * - `audio`: AI's synthesized audio chunk.
   * - `transcription`: User's transcribed speech from AI.
   * - `error`: An error message from the AI or backend.
   * - `turnComplete`: Indicates that a full turn of interaction (user input + AI response) is complete.
   */
  type: 'text' | 'audio' | 'transcription' | 'error' | 'turnComplete';
  /**
   * Text content, applicable for `text`, `transcription`, or `error` types.
   */
  text?: string;
  /**
   * Base64 encoded audio data, applicable for `audio` type.
   */
  audioBase64?: string;
  /**
   * MIME type of the audio, applicable for `audio` type (e.g., 'audio/wav', 'audio/mpeg').
   */
  audioMimeType?: string;
  /**
   * Boolean flag indicating turn completion, applicable for `turnComplete` type.
   */
  turnComplete?: boolean;
  /**
   * The ID of the current conversation session. This is mandatory for all AI responses.
   */
  conversationId: string;
}

/**
 * DTO for the initial connection confirmation message received on the `connected` WebSocket event.
 */
export interface ServerConnectedMessage {
  message: string;
}

/**
 * DTO for the session started confirmation message received on the `sessionStarted` WebSocket event.
 */
export interface SessionStartedMessage {
  conversationId: string;
  message?: string;
}
