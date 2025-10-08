import {
  GenerateTextDto,
  GenerateImageBase64Dto,
  GenerateVideoDto,
} from '@/types/ai';
import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from './fetch';

export const generateText = async (data: GenerateTextDto): Promise<string> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/gemini/file/generate-text`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  return handleResponse<string>(response);
};

export const generateTextWithBase64Image = async (
  data: GenerateImageBase64Dto,
): Promise<string> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/gemini/file/generate-image-base64`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  return handleResponse<string>(response);
};

export const generateTextWithFile = async (
  file: File,
  prompt: string,
  systemInstruction?: string,
  conversationId?: string,
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', prompt);
  if (systemInstruction) {
    formData.append('systemInstruction', systemInstruction);
  }
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }

  const response = await fetchWithAuth(
    `${API_BASE_URL}/gemini/file/generate-file`,
    {
      method: 'POST',
      body: JSON.stringify(formData),
    },
  );
  return handleResponse<string>(response);
};

interface GenerateVideoResponse {
  videoUri: string;
}

export const generateVideo = async (
  data: GenerateVideoDto,
): Promise<GenerateVideoResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/gemini/file/generate-video`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  return handleResponse<GenerateVideoResponse>(response);
};
