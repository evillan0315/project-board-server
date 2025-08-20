import { atom } from 'nanostores';
import { ResumeOutput } from '../types/resume';

interface ResumeStoreState {
  loading: boolean;
  error: string | null;
  currentResumeInput: string | null; // Stores what the user has provided (e.g., file path, raw text)
  resumeOutput: ResumeOutput | null; // Stores the processed/generated/optimized resume data
}

export const resumeStore = atom<ResumeStoreState>({
  loading: false,
  error: null,
  currentResumeInput: null,
  resumeOutput: null,
});
