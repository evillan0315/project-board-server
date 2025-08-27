import {
  GenerativeModel,
  ChatSession,
  CountTokensResponse,
  GenerateContentResult,
} from '@google/generative-ai';
import { LiveAudioInputDto, LiveMessageDto } from '../dto/gemini-live.dto';

export interface ConversationContent {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

// Server-side representation of an active Gemini Live session
export interface LiveSession {
  sessionId: string;
  userId: string;
  model: GenerativeModel;
  chat: ChatSession;
  conversationHistory: ConversationContent[]; // History for Gemini API context
  pendingTextInputs: string[]; // Buffered text inputs for the current turn
  pendingAudioChunks: { data: Buffer; mimeType: string }[]; // Buffered audio chunks (as Buffers)
  lastActivity: number; // Timestamp for session cleanup
  // A flag to ensure only one processTurn is active at a time
  isProcessingTurn: boolean;
}

// Helper to convert frontend DTO to internal audio chunk format
export interface InternalAudioChunk {
  data: Buffer;
  mimeType: string;
}
