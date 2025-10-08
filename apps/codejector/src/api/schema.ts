import { API_BASE_URL, fetchWithAuth, handleResponse } from './fetch';
import {
  Schema,
  CreateSchemaPayload,
  UpdateSchemaPayload,
  PaginationSchemaQuery,
  PaginationSchemaResult,
} from '@/types/schema';

// ──────────────────────────────────────────────────────────────────
// Schema API Client
// ──────────────────────────────────────────────────────────────────

const SCHEMA_API_PATH = `${API_BASE_URL}/schema`;

export const schemaApi = {
  /**
   * Creates a new schema.
   * @param payload The schema data to create.
   * @returns The created schema.
   */
  createSchema: async (payload: CreateSchemaPayload): Promise<Schema> => {
    const response = await fetchWithAuth(SCHEMA_API_PATH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<Schema>(response);
  },

  /**
   * Retrieves all schema records.
   * @returns An array of all schemas.
   */
  getAllSchemas: async (): Promise<Schema[]> => {
    const response = await fetchWithAuth(SCHEMA_API_PATH);
    return handleResponse<Schema[]>(response);
  },

  /**
   * Retrieves paginated schema records.
   * @param query Pagination and filter options.
   * @returns A paginated list of schemas.
   */
  getPaginatedSchemas: async (
    query: PaginationSchemaQuery,
  ): Promise<PaginationSchemaResult> => {
    const queryString = new URLSearchParams(
      query as Record<string, string>,
    ).toString();
    const url = `${SCHEMA_API_PATH}/paginated?${queryString}`;
    const response = await fetchWithAuth(url);
    return handleResponse<PaginationSchemaResult>(response);
  },

  /**
   * Retrieves a single schema by its ID.
   * @param id The ID of the schema to retrieve.
   * @returns The found schema.
   */
  getSchemaById: async (id: string): Promise<Schema> => {
    const response = await fetchWithAuth(`${SCHEMA_API_PATH}/${id}`);
    return handleResponse<Schema>(response);
  },

  /**
   * Updates an existing schema.
   * @param id The ID of the schema to update.
   * @param payload The update data for the schema.
   * @returns The updated schema.
   */
  updateSchema: async (
    id: string,
    payload: UpdateSchemaPayload,
  ): Promise<Schema> => {
    const response = await fetchWithAuth(`${SCHEMA_API_PATH}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return handleResponse<Schema>(response);
  },

  /**
   * Deletes a schema by its ID.
   * @param id The ID of the schema to delete.
   * @returns A success message or confirmation.
   */
  deleteSchema: async (id: string): Promise<any> => {
    const response = await fetchWithAuth(`${SCHEMA_API_PATH}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<any>(response);
  },
};
