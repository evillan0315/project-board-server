import axios from 'axios';
import { getAuthToken } from '../stores/authStore';
import type { TtsRequestDto } from '../types/tts';

const API_BASE_URL = '/api';

/**
 * Service for interacting with the Google Gemini TTS backend.
 */
export const geminiTtsService = {
  /**
   * Generates speech audio from text using the backend API.
   * Requires an authentication token.
   * @param data - The TTS request data including prompt, speakers, and language code.
   * @returns A Promise that resolves to a Blob containing the audio data.
   * @throws Error if authentication token is missing or API call fails.
   */
  generateSpeech: async (data: TtsRequestDto): Promise<Blob> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing. Please log in.');
    }

    try {
      const response = await axios.post<Blob>(`${API_BASE_URL}/google-tts/generate`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important: receive as a blob
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Try to parse error response if it's a JSON blob (common for NestJS errors)
        if (error.response?.data instanceof Blob) {
          const errorText = await error.response.data.text();
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(
              errorJson.message ||
                errorJson.error ||
                'An unknown API error occurred (parsed from blob)',
            );
          } catch {
            // If it's a blob but not JSON, just return the text
            throw new Error(errorText || 'An unknown API error occurred (non-JSON blob response)');
          }
        } else {
          // Handle non-blob error responses
          throw new Error(
            error.response?.data?.message || error.message || 'An unknown error occurred',
          );
        }
      } else {
        throw new Error((error as Error).message || 'An unexpected error occurred');
      }
    }
  },
};
