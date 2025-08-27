import { Session } from '@google/genai';

export interface LiveSessionState {
  session: Session; // The active Gemini Live session
  lastInteraction: number; // Timestamp of the last interaction for cleanup
  // You might add a buffer for incoming audio if you process it in chunks before sending to Gemini
  // For simplicity, we'll send directly in this implementation
}
