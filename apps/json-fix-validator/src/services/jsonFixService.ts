import { JsonInputDto, JsonOutputDto } from '@/types/json-fix';

const API_BASE_URL = '/api/utils/json'; // Using proxy defined in vite.config.ts

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Helper to handle API responses and throw detailed errors.
 */
const handleApiResponse = async (response: Response): Promise<JsonOutputDto> => {
  if (!response.ok) {
    const errorData: JsonOutputDto | ErrorResponse = await response.json();
    if (typeof errorData === 'object' && 'valid' in errorData && errorData.valid === false) {
      // Backend error format for validation/repair failures
      throw new Error(
        errorData.errors ? errorData.errors.join('\n') : 'Unknown validation/repair error.',
      );
    } else if (typeof errorData === 'object' && 'message' in errorData) {
      // Standard NestJS error format
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message.join('\n')
        : errorData.message;
      throw new Error(errorMessage || 'API request failed.');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  return response.json() as Promise<JsonOutputDto>;
};

/**
 * Validates a JSON string, optionally against a JSON schema.
 * @param json The JSON string to validate.
 * @param schema An optional JSON schema (object or stringified JSON) to validate against.
 * @returns A promise that resolves to JsonOutputDto indicating validity and errors if any.
 */
export const validateJson = async (
  json: string,
  schema?: Record<string, any> | string,
): Promise<JsonOutputDto> => {
  const requestBody: JsonInputDto = { json };
  if (schema) {
    requestBody.schema = schema;
  }

  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  return handleApiResponse(response);
};

/**
 * Attempts to repair a malformed JSON string.
 * @param json The malformed JSON string to repair.
 * @returns A promise that resolves to JsonOutputDto with the repaired JSON or errors.
 */
export const repairJson = async (json: string): Promise<JsonOutputDto> => {
  const requestBody: JsonInputDto = { json };

  const response = await fetch(`${API_BASE_URL}/repair`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  return handleApiResponse(response);
};
