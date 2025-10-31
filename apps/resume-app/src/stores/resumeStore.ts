import { map } from 'nanostores';
import type { OptimizationResult } from '@/types/resume';

interface ResumeState {
  resumeContent: string;
  jobDescription: string;
  parsedResumeText: string; // Text extracted from uploaded file
  optimizationResult: OptimizationResult | null;
  generatedResume: string;
  enhancedResume: string;
  generatedPortfolioHtml: string; // New field for generated portfolio HTML
  generatedCoverLetter: string; // New field for generated cover letter
  loading: {
    parse: boolean;
    optimize: boolean;
    generate: boolean;
    enhance: boolean;
    portfolio: boolean; // New loading flag for portfolio generation
    coverLetter: boolean; // New loading flag for cover letter generation
    export: boolean; // New loading flag for export operations
  };
  error: {
    parse: string | null;
    optimize: string | null;
    generate: string | null;
    enhance: string | null;
    portfolio: string | null; // New error flag for portfolio generation
    coverLetter: string | null; // New error flag for cover letter generation
    export: string | null; // New error flag for export operations
    general: string | null;
  };
}

export const resumeStore = map<ResumeState>({
  resumeContent: '',
  jobDescription: '',
  parsedResumeText: '',
  optimizationResult: null,
  generatedResume: '',
  enhancedResume: '',
  generatedPortfolioHtml: '', // Initialize new field
  generatedCoverLetter: '', // Initialize new field
  loading: {
    parse: false,
    optimize: false,
    generate: false,
    enhance: false,
    portfolio: false, // Initialize new loading flag
    coverLetter: false, // Initialize new loading flag
    export: false, // Initialize new loading flag
  },
  error: {
    parse: null,
    optimize: null,
    generate: null,
    enhance: null,
    portfolio: null, // Initialize new error flag
    coverLetter: null, // Initialize new error flag
    export: null, // Initialize new error flag
    general: null,
  },
});

// Action to reset errors
export const resetErrors = () => {
  resumeStore.set({
    ...resumeStore.get(),
    error: {
      parse: null,
      optimize: null,
      generate: null,
      enhance: null,
      portfolio: null,
      coverLetter: null, // Reset new error
      export: null, // Reset new error
      general: null,
    },
  });
};
