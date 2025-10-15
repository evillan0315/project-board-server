import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from './fetch';

// --- Interfaces based on backend DTOs and Prisma models ---

/**
 * DTO for creating a new Conversation via REST.
 * Matches backend's `CreateConversationDto`.
 */
export interface CreateConversationDto {
  title: string;
  createdById: string;
}

/**
 * DTO for getting a list of conversations for a user via REST.
 * Matches backend's `GetConversationsDto`.
 */
export interface GetConversationsDto {
  userId: string;
}

/**
 * Represents a Conversation entity from the backend.
 * Simplified for frontend consumption.
 */
export interface Conversation {
  id: string;
  title: string;
  createdById: string;
  status: 'ACTIVE' | 'ARCHIVED'; // Assuming these are valid statuses
  createdAt: string; // ISO Date string
  updatedAt: string | null; // ISO Date string
}

// ────────────────────────────────────────────────────────────────────────────
// Chat Conversation REST API Functions
// ────────────────────────────────────────────────────────────────────────────

const CHAT_CONVERSATIONS_BASE_URL = `${API_BASE_URL}/chat/conversations`;

/**
 * Creates a new chat conversation on the backend.
 * @param data The data for creating the conversation (title, createdById).
 * @returns A promise that resolves to the created Conversation object.
 */
export const createConversation = async (
  data: CreateConversationDto,
): Promise<Conversation> => {
  try {
    const response = await fetchWithAuth(CHAT_CONVERSATIONS_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<Conversation>(response);
  } catch (error: ApiError) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Retrieves a list of conversations for a specific user from the backend.
 * @param userId The ID of the user whose conversations are to be fetched.
 * @returns A promise that resolves to an array of Conversation objects.
 */
export const getConversationsByUserId = async (
  userId: string,
): Promise<Conversation[]> => {
  try {
    const response = await fetchWithAuth(
      `${CHAT_CONVERSATIONS_BASE_URL}?userId=${userId}`,
      {
        method: 'GET',
      },
    );
    return handleResponse<Conversation[]>(response);
  } catch (error: ApiError) {
    console.error(
      `Error fetching conversations for user ${userId}:`, 
      error
    );
    throw error;
  }
};
