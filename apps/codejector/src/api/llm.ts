import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import { generateText } from './ai';
import {
  ModelResponse,
  FileChange,
  LlmGeneratePayload,
  LlmReportErrorApiPayload,
  LLM_ENDPOINT,
  SchemaResponse,
  RequestType,
} from '@/types'; // Import new LLM types and FileChange, RequestType, LlmOutputFormat, LlmGeneratePayload, LlmReportErrorApiPayload

interface ConvertYamlResponse {
  json: {};
  filePath: string;
}

export function extractCodeFromMarkdown(text: string): string {
  // Match a fenced code block: ```lang\n ... \n```
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return text.trim();
}

export const convertYamlToJson = async (data: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/utils/json-yaml/to-json?save=false`,
      {
        method: 'POST',
        body: JSON.stringify({ yaml: data }),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Error converting YAML to JSON:', error);
    throw error;
  }
};

function parseJSONSafe(jsonString: string): ModelResponse {
  try {
    return JSON.parse(jsonString);
  } catch (err: Error) {
    console.error('JSON parse error:', err);
    return {
      summary: null,
      changes: [],
      rawResponse: jsonString,
      error: err instanceof Error ? err.message : String(err),
      gitInstructions: [],
    };
  }
}

// ────────────────────────────
// Safe LLM code generation
// ────────────────────────────
export const generateSchema = async (prompt: string): Promise<string> => {
  const rawText: string | null = null;
  console.log(prompt, 'prompt');
  try {
    const response = await generateText({ prompt });
    return extractCodeFromMarkdown(response);

    //return extractCodeFromMarkdown(res);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      rawResponse: rawText,
      summary: null,
      changes: [],
      error: errorMsg,
    };
  }
};
export const generateCode = async (
  data: LlmGeneratePayload,
): Promise<ModelResponse> => {
  let rawText: string | null = null;

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llm/generate-llm`, {
      method: 'POST',
      body: JSON.stringify(data),
      //headers: { 'Content-Type': 'application/json' },
    });

    console.log(response, 'response');
    rawText = await response.text();
    console.log(rawText, 'rawText');
    const extractedText = extractCodeFromMarkdown(rawText);
    console.log(extractedText, 'extractedText');
    try {
      // Attempt to parse JSON
      const parsed: ModelResponse = JSON.parse(extractedText);

      return {
        ...parsed,
        rawResponse: rawText,
        error:
          parsed.error && parsed.message
            ? `${parsed.error}: ${parsed.message}`
            : null, // Ensure error is null
      };
    } catch (jsonErr) {
      console.log(JSON.parse(rawText), 'rawText');
      // If parsing fails, return raw content safely
      return {
        rawResponse: rawText,
        summary: null,
        changes: [],
        error: jsonErr instanceof Error ? jsonErr.message : String(jsonErr),
      };
    }
  } catch (err) {
    // Network or fetch error
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      rawResponse: rawText,
      summary: null,
      changes: [],
      error: errorMsg,
    };
  }
};

/**
 * Applies selected proposed changes to the file system.
 * @param changes An array of FileChange objects to apply.
 * @param projectRoot The root directory of the project.
 * @returns A promise indicating success or failure of the diff application.
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
  } catch (error) {
    console.error('Error applying changes:', error);
    throw error;
  }
};

/**
 * Fetches the git diff for a specific file.
 * @param filePath The path to the file for which to get the diff, relative to projectRoot.
 * @param projectRoot The root directory of the project (git repository).
 * @returns A promise that resolves to the git diff string.
 */
export const getGitDiff = async (
  filePath: string,
  projectRoot: string,
): Promise<string> => {
  try {
    // filePath should already be relative to projectRoot from the frontend's getRelativePath call.
    // Do NOT prepend projectRoot here, as it would create an incorrect absolute path for the backend.
    const response = await fetchWithAuth(`${API_BASE_URL}/file/git-diff`, {
      method: 'POST',
      body: JSON.stringify({
        filePath: `${projectRoot}/${filePath}`,
        projectRoot,
      }),
    });
    const data = await handleResponse<{ diff: string }>(response);

    return data.diff;
  } catch (error) {
    console.error(`Error fetching git diff for ${filePath}:`, error);
    throw error;
  }
};

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

export type { LlmGeneratePayload }; // Export LlmGeneratePayload for use in other files
