import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';

import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  PaginationProjectQueryDto,
  PaginationProjectResultDto,
} from '@/types';

/**
 * Creates a new project.
 */
export const createProject = async (
  dto: CreateProjectDto,
): Promise<Project> => {
  try {
    const response = await fetchWithAuth(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<Project>(response);
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Retrieves all project records, optionally filtered by organization.
 */
export const getProjects = async (
  organizationId?: string,
): Promise<Project[]> => {
  const queryString = organizationId ? `?organizationId=${organizationId}` : '';
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}${queryString}`, {
      method: 'GET',
    });
    return handleResponse<Project[]>(response);
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Retrieves paginated project records, optionally filtered by organization.
 */
export const getPaginatedProjects = async (
  query: PaginationProjectQueryDto = {},
): Promise<PaginationProjectResultDto> => {
  const queryString = new URLSearchParams(
    query as Record<string, any>,
  ).toString();
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/paginated?${queryString}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<PaginationProjectResultDto>(response);
  } catch (error) {
    console.error('Error fetching paginated projects:', error);
    throw error;
  }
};

/**
 * Finds a project by its ID.
 */
export const getProjectById = async (id: string): Promise<Project> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'GET',
    });
    return handleResponse<Project>(response);
  } catch (error) {
    console.error(`Error fetching project with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates a project by its ID.
 */
export const updateProject = async (
  id: string,
  dto: UpdateProjectDto,
): Promise<Project> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return handleResponse<Project>(response);
  } catch (error) {
    console.error(`Error updating project with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a project by its ID.
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    // For delete, usually no content, just status check
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting project with ID ${id}:`, error);
    throw error;
  }
};
