import { api } from './api';
import {
  GenerateResumePayload,
  GenerateResumeResponse,
  OptimizeResumePayload,
  OptimizationResult,
  EnhanceResumePayload,
} from '../types/resume';

export const resumeService = {
  uploadResume: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // The backend endpoint for resume upload is expected to be '/resume/upload'
    // It's possible it returns a path or ID to the uploaded resume.
    const response = await api<string>('/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return response;
  },

  generateResume: async (payload: GenerateResumePayload): Promise<GenerateResumeResponse> => {
    // This endpoint should correspond to NestJS google-gemini-file controller's generateResume
    const response = await api<GenerateResumeResponse>('/google-gemini-file/generate-resume', {
      method: 'POST',
      body: payload,
    });
    return response;
  },

  optimizeResume: async (payload: OptimizeResumePayload): Promise<OptimizationResult> => {
    // This endpoint should correspond to NestJS google-gemini-file controller's optimizeResume
    const response = await api<OptimizationResult>('/google-gemini-file/optimize-resume', {
      method: 'POST',
      body: payload,
    });
    return response;
  },

  enhanceResume: async (payload: EnhanceResumePayload): Promise<string> => {
    // This endpoint should correspond to NestJS google-gemini-file controller's enhanceResume
    const response = await api<string>('/google-gemini-file/enhance-resume', {
      method: 'POST',
      body: payload,
    });
    return response;
  },

  // Add more resume-related API calls as needed
};
