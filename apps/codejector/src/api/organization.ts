import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import { getToken } from '@/stores/authStore';
import {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  PaginationOrganizationQueryDto,
  PaginationOrganizationResultDto,
} from '@/types';

/**
 * Creates a new organization.
 */
export const createOrganization = async (
  dto: CreateOrganizationDto,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/organization`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Retrieves all organization records.
 */
export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/organization`, {
      method: 'GET',
    });
    return handleResponse<Organization[]>(response);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

/**
 * Retrieves paginated organization records.
 */
export const getPaginatedOrganizations = async (
  query: PaginationOrganizationQueryDto = {},
): Promise<PaginationOrganizationResultDto> => {
  const queryString = new URLSearchParams(
    query as Record<string, any>,
  ).toString();
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/organization/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationOrganizationResultDto>(response);
  } catch (error) {
    console.error('Error fetching paginated organizations:', error);
    throw error;
  }
};

/**
 * Finds an organization by its ID.
 */
export const getOrganizationById = async (
  id: string,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/organization/${id}`, {
      method: 'GET',
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error(`Error fetching organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an organization by its ID.
 */
export const updateOrganization = async (
  id: string,
  dto: UpdateOrganizationDto,
): Promise<Organization> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/organization/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return handleResponse<Organization>(response);
  } catch (error) {
    console.error(`Error updating organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes an organization by its ID.
 */
export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/organization/${id}`, {
      method: 'DELETE',
    });
    // For delete, usually no content, just status check
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting organization with ID ${id}:`, error);
    throw error;
  }
};
