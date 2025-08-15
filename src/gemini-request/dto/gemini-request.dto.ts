// src/gemini-request/dto/gemini-request.dto.ts
// Assuming RequestType is defined elsewhere, e.g., in @prisma/client or a shared types file
import { RequestType } from '@prisma/client'; // Adjust this import based on where your enum is

export interface GeminiRequest {
  // Define as interface if it's just for type checking
  id: string;
  createdAt: Date;
  prompt: string;
  imageUrl: string | null;
  systemInstruction: string | null;
  conversationId: string | null; // Ensure this matches actual DB/service return type
  userId: string;
  modelUsed: string;
  requestType: RequestType;
  imageData: string | null;
  fileMimeType: string | null;
  fileData: string | null;
}
