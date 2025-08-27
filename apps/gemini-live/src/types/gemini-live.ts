// src/types/gemini-live.d.ts

// IMPORTANT: Directly import backend DTOs for perfect type alignment.
// Adjust the path below to correctly point to your backend's DTO file.
import {
  ILiveConnectOptionsDto as LiveConnectOptionsDto,
  ILiveSessionResponseDto as LiveSessionResponseDto,
  ILiveMessageDto as LiveMessageDto,
  ILiveTurnResultDto as LiveTurnResultDto,
  ILiveTextInputDto as LiveTextInputDto,
  ILiveAudioInputDto as LiveAudioInputDto,
  IProcessTurnDto as ProcessTurnDto,
  ILiveEndSessionDto as LiveEndSessionDto,
  ILiveConfigDto as LiveConfigDto,
} from './gemini-live-interface'; // Adjust this path!

/**
 * Represents the status of the Gemini Live session.
 */
export type LiveSessionStatus = 'disconnected' | 'connecting' | 'active' | 'error';

/**
 * Represents a message in the conversation history displayed in the UI.
 * This is a frontend-specific type, mapping backend responses to displayable items.
 *
 * NOTE: `audioUrl` is removed here because the current backend REST API simulation
 * does NOT provide direct AI audio output. If AI audio is desired, a separate
 * Text-to-Speech (TTS) service/pipeline would be required.
 */
export interface LiveMessage {
  sender: 'user' | 'ai' | 'system';
  text: string;
  // audioUrl?: string; // Removed: AI audio output not directly supported by current REST API simulation
  timestamp?: Date;
}

// Re-export the backend DTOs for direct use in the frontend components/hooks.
// This ensures that `useGeminiLiveSocket` uses the exact types defined by the backend.
export {
  LiveConnectOptionsDto,
  LiveSessionResponseDto,
  LiveMessageDto,
  LiveTurnResultDto,
  LiveTextInputDto,
  LiveAudioInputDto,
  ProcessTurnDto,
  LiveEndSessionDto,
  LiveConfigDto,
};

