// resumeApi.ts

import type {
  OptimizationResult,
  OptimizeResumeDto,
  GenerateResumeDto,
  EnhanceResumeDto,
  GeneratePortfolioDto,
  GenerateCoverLetterDto, // New: Import GenerateCoverLetterDto
} from '@/types/resume'; // Make sure this path is correct for your frontend types

const API_BASE_URL = '/api/resume';

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    const errorMessage = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'An unknown error occurred';
    // It's good practice to throw an Error instance for better stack traces
    throw new Error(`API Error ${errorData.statusCode}: ${errorMessage}`);
  }
  // Check for empty response body for text responses
  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  // If expecting text but response is empty/not JSON, return as text
  return response.text() as Promise<T>;
}

// Helper to get authorization headers (replace with actual auth logic if needed)
const getAuthHeaders = () => {
  // With HTTP-only cookies (set by the backend), the browser automatically sends the 'accessToken' cookie
  // if it's set for the domain the request is being made to. This is the recommended secure approach.
  // Therefore, no explicit 'Authorization' header needs to be manually set from localStorage/store for this setup.
  return {};
};

export const parseResumeFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/parse`, {
    method: 'POST',
    body: formData,
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.text(); // parseResumeFile returns plain text
};

export const optimizeResume = async (
  payload: OptimizeResumeDto & { resumeFile?: File }, // Payload type indicating file or content
): Promise<OptimizationResult> => {
  const formData = new FormData();

  // Handle mutual exclusivity for resumeFile and resumeContent
  if (payload.resumeFile) {
    formData.append('resumeFile', payload.resumeFile); // Append the actual File object
    // Do NOT append resumeContent if a file is provided
  } else if (payload.resumeContent) {
    formData.append('resumeContent', payload.resumeContent);
    // Do NOT append resumeFile if content is provided
  } else {
    // Client-side validation: ensure at least one is provided
    throw new Error('Either a resume file or plain text resume content is required for optimization.');
  }

  formData.append('jobDescription', payload.jobDescription);

  if (payload.conversationId) {
    formData.append('conversationId', payload.conversationId);
  }
  // If you also wanted to send 'systemInstruction' from the frontend:
  // if (payload.systemInstruction) {
  //   formData.append('systemInstruction', payload.systemInstruction);
  // }

  // accessToken and githubUsername are NOT sent from the frontend in FormData,
  // as they are handled and injected by the backend controller.

  const response = await fetch(`${API_BASE_URL}/optimize-from-file`, {
    method: 'POST',
    body: formData,
    headers: {
      ...getAuthHeaders(),
      // 'Content-Type': 'multipart/form-data' is automatically set by the browser when using FormData,
      // including the boundary, so it should not be manually set here.
    },
  });
  return handleResponse<OptimizationResult>(response);
};

export const generateResume = async (payload: GenerateResumeDto): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<string>(response);
};

export const enhanceResume = async (payload: EnhanceResumeDto): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/enhance-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<string>(response);
};

export const generatePortfolio = async (payload: GeneratePortfolioDto): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<string>(response);
};

export const generateCoverLetter = async (payload: GenerateCoverLetterDto): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<string>(response);
};
