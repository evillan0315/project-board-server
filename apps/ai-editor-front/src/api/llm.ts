import { getToken } from '@/stores/authStore';
import { LlmGeneratePayload, LlmResponse, ProposedFileChange } from '@/types/llm'; // Import new LLM types and ProposedFileChange

const API_BASE_URL = `/api`; // Changed to relative path for Vite proxy consistency

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

/**
 * Sends a request to the LLM backend to generate code based on user prompt and project context.
 * The backend will handle reading relevant files and building the project structure.
 * @param data The payload containing user prompt, project root, scan paths, and instructions.
 * @returns A promise that resolves to the LLM's structured response with proposed file changes.
 */
export const generateCode = async (data: LlmGeneratePayload): Promise<LlmResponse> => {
  try {
    // projectRoot is now part of LlmGeneratePayload, no need for it as a query parameter.
    const response = await fetchWithAuth(`${API_BASE_URL}/llm/generate-llm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<LlmResponse>(response);
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};

/**
 * Applies selected proposed changes to the file system.
 * @param changes An array of ProposedFileChange objects to apply.
 * @param projectRoot The root directory of the project.
 * @returns A promise indicating success or failure of the diff application.
 */
export const applyProposedChanges = async (
  changes: ProposedFileChange[],
  projectRoot: string,
): Promise<{ success: boolean; messages: string[] }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/apply-changes`, {
      method: 'POST',
      body: JSON.stringify({ changes, projectRoot }),
    });
    return handleResponse<{ success: boolean; messages: string[] }>(response);
  } catch (error) {
    console.error('Error applying changes:', error);
    throw error;
  }
};

/**
 * Fetches the git diff for a specific file.
 * @param filePath The path to the file for which to get the diff.
 * @param projectRoot The root directory of the project (git repository).
 * @returns A promise that resolves to the git diff string.
 */
export const getGitDiff = async (filePath: string, projectRoot: string): Promise<string> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/git-diff`, {
      method: 'POST',
      body: JSON.stringify({ filePath, projectRoot }),
    });
    const data = await handleResponse<{ diff: string }>(response);
    return data.diff;
  } catch (error) {
    console.error(`Error fetching git diff for ${filePath}:`, error);
    throw error;
  }
};
