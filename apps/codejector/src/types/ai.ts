export interface GenerateTextDto {
  prompt: string;
  systemInstruction?: string;
  conversationId?: string;
}

export interface GenerateImageBase64Dto {
  prompt: string;
  base64Image: string;
  mimeType: string;
  systemInstruction?: string;
  conversationId?: string;
}

export interface GenerateVideoDto {
  prompt: string;
  conversationId?: string;
}
