import { fetchWithAuth, handleResponse } from './fetch';
import {
  IMemberDto,
  IMemberResponse,
  IMemberPaginatedResult,
  IMemberQueryDto,
} from '@/components/swingers/types';
import { API_MEMBERS_BASE_URL } from '@/components/swingers/api/fetch';



/**
 * Fetches all member records. Requires ADMIN role.
 * @returns A promise that resolves to an array of IMemberResponse objects.
 */
export const getMembers = async (): Promise<IMemberResponse[]> => {
  try {
    const response = await fetchWithAuth<IMemberResponse[]>(
      API_MEMBERS_BASE_URL,
      { method: 'GET' },
    );
    return handleResponse<IMemberResponse[]>(response);
  } catch (error) {
    console.error(`Error fetching members:`, error);
    throw error;
  }
};

/**
 * Fetches paginated member records based on query parameters. Requires ADMIN role.
 * @param query IMemberQueryDto for pagination and filtering.
 * @returns A promise that resolves to an IMemberPaginatedResult object.
 */
export const getMembersPaginated = async (query: IMemberQueryDto): Promise<IMemberPaginatedResult> => {
  try {
    // Build query string from IMemberQueryDto
    const params = new URLSearchParams();
    for (const key in query) {
      if (query[key] !== undefined && query[key] !== null) {
        params.append(key, String(query[key]));
      }
    }
    const queryString = params.toString();

    const response = await fetchWithAuth<IMemberPaginatedResult>(
      `${API_MEMBERS_BASE_URL}/paginated?${queryString}`,
      { method: 'GET' },
    );
    return handleResponse<IMemberPaginatedResult>(response);
  } catch (error) {
    console.error(`Error fetching paginated members:`, error);
    throw error;
  }
};

/**
 * Fetches a single member by ID. Requires ADMIN role.
 * @param id The ID of the member to fetch (UUID string).
 * @returns A promise that resolves to an IMemberResponse object.
 */
export const getMember = async (id: string): Promise<IMemberResponse> => {
  try {
    const response = await fetchWithAuth<IMemberResponse>(
      `${API_MEMBERS_BASE_URL}/${id}`,
      { method: 'GET' },
    );
    return handleResponse<IMemberResponse>(response);
  } catch (error) {
    console.error(`Error fetching member with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new member. Requires ADMIN role.
 * @param data The IMemberDto containing the new member's data.
 * @returns A promise that resolves to the created IMemberResponse object.
 */
export const createMember = async (data: IMemberDto): Promise<IMemberResponse> => {
  try {
    const response = await fetchWithAuth<IMemberResponse>(
      API_MEMBERS_BASE_URL,
      {
        method: 'POST',
        data: data,
      },
    );
    return handleResponse<IMemberResponse>(response);
  } catch (error) {
    console.error(`Error creating member:`, error);
    throw error;
  }
};

/**
 * Updates an existing member by ID. Requires ADMIN role.
 * @param id The ID of the member to update (UUID string).
 * @param data The IMemberDto containing the updated member's data.
 * @returns A promise that resolves to the updated IMemberResponse object.
 */
export const updateMember = async (id: string, data: IMemberDto): Promise<IMemberResponse> => {
  try {
    const response = await fetchWithAuth<IMemberResponse>(
      `${API_MEMBERS_BASE_URL}/${id}`,
      {
        method: 'PATCH',
        data: data,
      },
    );
    return handleResponse<IMemberResponse>(response);
  } catch (error) {
    console.error(`Error updating member with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a member by ID. Requires ADMIN role.
 * @param id The ID of the member to delete (UUID string).
 * @returns A promise that resolves when the member is successfully deleted.
 */
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth<void>(
      `${API_MEMBERS_BASE_URL}/${id}`,
      { method: 'DELETE' },
    );
    return handleResponse<void>(response);
  } catch (error) {
    console.error(`Error deleting member with ID ${id}:`, error);
    throw error;
  }
};
