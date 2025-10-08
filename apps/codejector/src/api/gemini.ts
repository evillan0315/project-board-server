import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import {
  GeminiRequest,
  CreateGeminiRequestDto,
  UpdateGeminiRequestDto,
  PaginationGeminiRequestQueryDto,
  PaginationGeminiRequestResultDto,
  GeminiResponse,
  CreateGeminiResponseDto,
  UpdateGeminiResponseDto,
  PaginationGeminiResponseQueryDto,
  PaginationGeminiResponseResultDto,
} from '@/types/gemini';

// ────────────────────────────────────────────────────────────────────────────
// Gemini Request API Functions
// ────────────────────────────────────────────────────────────────────────────

const GEMINI_REQUEST_BASE_URL = `${API_BASE_URL}/gemini-request`;

/**
 * Creates a new Gemini Request.
 * @param data The data for the new Gemini Request.
 * @returns A promise that resolves to the created GeminiRequest.
 */
export const createGeminiRequest = async (
  data: CreateGeminiRequestDto,
): Promise<GeminiRequest> => {
  try {
    const response = await fetchWithAuth(GEMINI_REQUEST_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<GeminiRequest>(response);
  } catch (error) {
    console.error('Error creating Gemini request:', error);
    throw error;
  }
};

/**
 * Retrieves all Gemini Request records.
 * @returns A promise that resolves to an array of GeminiRequest.
 */
export const getGeminiRequests = async (): Promise<GeminiRequest[]> => {
  try {
    const response = await fetchWithAuth(GEMINI_REQUEST_BASE_URL, {
      method: 'GET',
    });
    return handleResponse<GeminiRequest[]>(response);
  } catch (error) {
    console.error('Error fetching all Gemini requests:', error);
    throw error;
  }
};

/**
 * Retrieves paginated Gemini Request records.
 * @param query Pagination and filter parameters.
 * @returns A promise that resolves to paginated results.
 */
export const getPaginatedGeminiRequests = async (
  query: PaginationGeminiRequestQueryDto,
): Promise<PaginationGeminiRequestResultDto> => {
  try {
    const queryString = new URLSearchParams(query as any).toString();
    const response = await fetchWithAuth(
      `${GEMINI_REQUEST_BASE_URL}/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationGeminiRequestResultDto>(response);
  } catch (error) {
    console.error('Error fetching paginated Gemini requests:', error);
    throw error;
  }
};

/**
 * Retrieves a Gemini Request by its ID.
 * @param id The ID of the Gemini Request to retrieve.
 * @returns A promise that resolves to the GeminiRequest, or null if not found.
 */
export const getGeminiRequestById = async (
  id: string,
): Promise<GeminiRequest> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_REQUEST_BASE_URL}/${id}`, {
      method: 'GET',
    });
    return handleResponse<GeminiRequest>(response);
  } catch (error) {
    console.error(`Error fetching Gemini request with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing Gemini Request.
 * @param id The ID of the Gemini Request to update.
 * @param data The update data.
 * @returns A promise that resolves to the updated GeminiRequest.
 */
export const updateGeminiRequest = async (
  id: string,
  data: UpdateGeminiRequestDto,
): Promise<GeminiRequest> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_REQUEST_BASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse<GeminiRequest>(response);
  } catch (error) {
    console.error(`Error updating Gemini request with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a Gemini Request by its ID.
 * @param id The ID of the Gemini Request to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteGeminiRequest = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_REQUEST_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error(`Error deleting Gemini request with ID ${id}:`, error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Gemini Response API Functions
// ────────────────────────────────────────────────────────────────────────────

const GEMINI_RESPONSE_BASE_URL = `${API_BASE_URL}/gemini-response`;

/**
 * Creates a new Gemini Response.
 * @param data The data for the new Gemini Response.
 * @returns A promise that resolves to the created GeminiResponse.
 */
export const createGeminiResponse = async (
  data: CreateGeminiResponseDto,
): Promise<GeminiResponse> => {
  try {
    const response = await fetchWithAuth(GEMINI_RESPONSE_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<GeminiResponse>(response);
  } catch (error) {
    console.error('Error creating Gemini response:', error);
    throw error;
  }
};

/**
 * Retrieves all Gemini Response records.
 * @returns A promise that resolves to an array of GeminiResponse.
 */
export const getGeminiResponses = async (): Promise<GeminiResponse[]> => {
  try {
    const response = await fetchWithAuth(GEMINI_RESPONSE_BASE_URL, {
      method: 'GET',
    });
    return handleResponse<GeminiResponse[]>(response);
  } catch (error) {
    console.error('Error fetching all Gemini responses:', error);
    throw error;
  }
};

/**
 * Retrieves paginated Gemini Response records.
 * @param query Pagination and filter parameters.
 * @returns A promise that resolves to paginated results.
 */
export const getPaginatedGeminiResponses = async (
  query: PaginationGeminiResponseQueryDto,
): Promise<PaginationGeminiResponseResultDto> => {
  try {
    const queryString = new URLSearchParams(query as any).toString();
    const response = await fetchWithAuth(
      `${GEMINI_RESPONSE_BASE_URL}/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationGeminiResponseResultDto>(response);
  } catch (error) {
    console.error('Error fetching paginated Gemini responses:', error);
    throw error;
  }
};

/**
 * Retrieves Gemini Response records filtered by a specific request ID.
 * @param requestId The ID of the Gemini Request to filter responses by.
 * @returns A promise that resolves to an array of GeminiResponse.
 */
export const getGeminiResponsesByRequestId = async (
  requestId: string,
  requestType?: string,
): Promise<GeminiResponse[]> => {
  try {
    const query: PaginationGeminiResponseQueryDto = { requestId, requestType };
    const result = await getPaginatedGeminiResponses(query);
    return result.items;
  } catch (error) {
    console.error(
      `Error fetching Gemini responses for request ID ${requestId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Retrieves a Gemini Response by its ID.
 * @param id The ID of the Gemini Response to retrieve.
 * @returns A promise that resolves to the GeminiResponse, or null if not found.
 */
export const getGeminiResponseById = async (
  id: string,
): Promise<GeminiResponse> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_RESPONSE_BASE_URL}/${id}`, {
      method: 'GET',
    });
    return handleResponse<GeminiResponse>(response);
  } catch (error) {
    console.error(`Error fetching Gemini response with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing Gemini Response.
 * @param id The ID of the Gemini Response to update.
 * @param data The update data.
 * @returns A promise that resolves to the updated GeminiResponse.
 */
export const updateGeminiResponse = async (
  id: string,
  data: UpdateGeminiResponseDto,
): Promise<GeminiResponse> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_RESPONSE_BASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse<GeminiResponse>(response);
  } catch (error) {
    console.error(`Error updating Gemini response with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a Gemini Response by its ID.
 * @param id The ID of the Gemini Response to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteGeminiResponse = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await fetchWithAuth(`${GEMINI_RESPONSE_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error(`Error deleting Gemini response with ID ${id}:`, error);
    throw error;
  }
};
