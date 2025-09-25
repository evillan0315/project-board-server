// src/services/llm/generate.ts
import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';
import {
  LlmGeneratePayload,
  ModelResponse,
  FileChange,
  LlmOutputFormat,
} from '@/types/llm';
import { extractCodeFromMarkdown, convertYamlToJson } from './utils';

/**
 * Generates code via LLM backend using the provided payload.
 * Handles YAML output conversion and fenced code block extraction.
 */
export const generateCode = async (
  data: LlmGeneratePayload,
): Promise<ModelResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llm/generate-llm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Raw text response
    const rawText = await response.text();

    // Extract code block if present
    const extractedText = extractCodeFromMarkdown(rawText);

    if (data.output === LlmOutputFormat.YAML) {
      const json = await convertYamlToJson(extractedText);
      return json.json as ModelResponse;
    }

    // Default: parse JSON
    return JSON.parse(extractedText) as ModelResponse;
  } catch (err) {
    console.error('Error generating code:', err);
    throw err;
  }
};

/**
 * Applies a set of proposed file changes.
 * @param changes Array of FileChange objects
 * @param projectRoot Project root path
 * @returns Success and messages for each change applied
 */
export const applyProposedChanges = async (
  changes: FileChange[],
  projectRoot: string,
): Promise<{ success: boolean; messages: string[] }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/apply-changes`, {
      method: 'POST',
      body: JSON.stringify({ changes, projectRoot }),
    });

    return handleResponse<{ success: boolean; messages: string[] }>(response);
  } catch (err) {
    console.error('Error applying proposed changes:', err);
    throw err;
  }
};

/**
 * Fetches git diff for a specific file.
 * @param filePath Relative file path from projectRoot
 * @param projectRoot Root directory of the project
 * @returns The git diff as a string
 */
export const getGitDiff = async (
  filePath: string,
  projectRoot: string,
): Promise<string> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/git-diff`, {
      method: 'POST',
      body: JSON.stringify({
        filePath: `${projectRoot}/${filePath}`,
        projectRoot,
      }),
    });

    const data = await handleResponse<{ diff: string }>(response);
    return data.diff;
  } catch (err) {
    console.error(`Error fetching git diff for ${filePath}:`, err);
    throw err;
  }
};

