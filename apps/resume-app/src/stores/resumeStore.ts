import { map } from 'nanostores';
import type { OptimizationResult } from '@/types/resume';

interface ResumeState {
  resumeContent: string;
  jobDescription: string;
  parsedResumeText: string; // Text extracted from uploaded file
  optimizationResult: OptimizationResult | null;
  generatedResume: string;
  enhancedResume: string;
  loading: {
    parse: boolean;
    optimize: boolean;
    generate: boolean;
    enhance: boolean;
  };
  error: {
    parse: string | null;
    optimize: string | null;
    generate: string | null;
    enhance: string | null;
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
  loading: {
    parse: false,
    optimize: false,
    generate: false,
    enhance: false,
  },
  error: {
    parse: null,
    optimize: null,
    generate: null,
    enhance: null,
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
      general: null,
    },
  });
};
