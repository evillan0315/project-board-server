import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';
import {
  LlmReportErrorApiPayload
} from '@/types/llm';

/**
 * Reports a frontend error (e.g., build failure, git command failure) back to the LLM backend.
 * This allows the LLM to learn from real-world execution outcomes and refine its future responses.
 * @param payload The error details and context to send to the LLM.
 * @returns A promise indicating the success or failure of the error report.
 */
export const reportErrorToLlm = async (
  payload: LlmReportErrorApiPayload,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llm/report-error`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  } catch (error) {
    console.error('Error reporting error to LLM backend:', error);
    throw error;
  }
};
