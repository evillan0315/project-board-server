export interface OptimizationSuggestion {
  type: string;
  recommendation: string;
  details?: string[];
}

export interface OptimizationResult {
  optimizationScore: number;
  tailoredSummary: string;
  suggestions: OptimizationSuggestion[];
  improvedResumeSection?: string;
  conversationId?: string;
}

export interface OptimizeResumeDto {
  resumeContent: string;
  jobDescription: string;
  systemInstruction?: string;
  conversationId?: string;
}

export interface GenerateResumeDto {
  prompt: string;
  systemInstruction?: string;
  conversationId?: string;
}

export interface EnhanceResumeDto {
  resumeContent: string;
  sectionToEnhance?: string;
  enhancementGoal?: string;
  systemInstruction?: string;
  conversationId?: string;
}
