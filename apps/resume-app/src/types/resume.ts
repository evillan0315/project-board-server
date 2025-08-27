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

export enum OutputFormat {
  HTML = "html", // Converts Markdown to HTML
  DOCX = "docx", // Converts Markdown to DOCX
  PLAIN_TEXT = "plain_text", // Converts Markdown to Plain Text
  JSON_AST = "json_ast", // Converts Markdown to JSON AST
  DOCX_FROM_HTML = "docx_from_html", // Converts HTML to DOCX (input treated as HTML)
}
export const ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text' | 'stream';
// The MarkdownConvertRequest type might not be strictly necessary anymore
// as request bodies will be constructed dynamically based on the format and endpoint.
// But keeping it as a placeholder if you have other generic APIs.
export type MarkdownConvertRequest = {
  markdownContent: string;
  format: OutputFormat;
  // Potentially other fields like filename etc.
};