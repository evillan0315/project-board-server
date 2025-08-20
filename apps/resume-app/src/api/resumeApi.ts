import type {
  OptimizationResult,
  OptimizeResumeDto,
  GenerateResumeDto,
  EnhanceResumeDto,
} from '@/types/resume';

const API_BASE_URL = 'http://localhost:3000/api/resume'; // Adjust if your backend runs on a different port/host

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
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

// Helper to get authorization headers (replace with actual auth logic if needed)
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken'); // Assuming token is stored in localStorage
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  return handleResponse<string>(response);
};

export const optimizeResume = async (
  payload: OptimizeResumeDto & { resumeFile?: File },
): Promise<OptimizationResult> => {
  const formData = new FormData();

  if (payload.resumeFile) {
    formData.append('resumeFile', payload.resumeFile);
  } else {
    formData.append('resumeContent', payload.resumeContent);
  }
  formData.append('jobDescription', payload.jobDescription);

  if (payload.systemInstruction) {
    formData.append('systemInstruction', payload.systemInstruction);
  }
  if (payload.conversationId) {
    formData.append('conversationId', payload.conversationId);
  }

  const response = await fetch(`${API_BASE_URL}/optimize-from-file`, {
    method: 'POST',
    body: formData,
    headers: {
      ...getAuthHeaders(),
      // No 'Content-Type': 'multipart/form-data' header needed when using FormData, browser sets it correctly with boundary
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
