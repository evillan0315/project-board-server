/**
 * Represents a structured resume section.
 */
export interface ResumeSection {
  title: string;
  content: string[]; // List of bullet points or paragraphs
}

/**
 * Represents the output structure of a generated or optimized resume.
 * This aligns with potential JSON output from Google Gemini.
 */
export interface ResumeOutput {
  sections?: ResumeSection[];
  formattedResume?: string; // HTML or Markdown string for direct display
  optimizationSuggestions?: string[]; // Suggestions for improvement
  rawOutput?: any; // Raw output from the AI for debugging/transparency
}

/**
 * Payload for generating a resume from text.
 * Corresponds to `GenerateResumeDto` in NestJS.
 */
export interface GenerateResumePayload {
  text: string;
  outputFormat?: 'json' | 'markdown' | 'pdf_base64';
  model?: string;
}

/**
 * Payload for optimizing a resume.
 * Corresponds to `OptimizeResumeDto` in NestJS.
 */
export interface OptimizeResumePayload {
  resumeContent: string; // The resume content (could be text from parsed PDF/DOCX or manual input)
  jobDescription: string;
  outputFormat?: 'json' | 'markdown' | 'pdf_base64';
  model?: string;
}

/**
 * Payload for enhancing a resume.
 * Corresponds to `EnhanceResumeDto` in NestJS.
 */
export interface EnhanceResumePayload {
  resumeContent: string;
  jobDescription: string;
  outputFormat?: 'json' | 'markdown' | 'pdf_base64';
  model?: string;
}

/**
 * Response for resume generation (could be the structured ResumeOutput itself or a wrapper).
 */
export type GenerateResumeResponse = ResumeOutput;

/**
 * Represents the result of an optimization process.
 * This might be the `ResumeOutput` but explicitly named for clarity.
 */
export type OptimizationResult = ResumeOutput;
