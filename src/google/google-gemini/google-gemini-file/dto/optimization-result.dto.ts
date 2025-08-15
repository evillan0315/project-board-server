// src/google-gemini/dto/optimization-result.dto.ts (Response DTO)
// This mirrors the frontend's expected structure
export class OptimizationSuggestionDto {
  type: string;
  recommendation: string;
  details?: string[];
}

export class OptimizationResultDto {
  optimizationScore: number;
  tailoredSummary: string;
  suggestions: OptimizationSuggestionDto[];
  improvedResumeSection?: string; // Optional, AI might return a rewritten section
  conversationId?: string;
}
