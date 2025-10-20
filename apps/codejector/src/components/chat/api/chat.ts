/**
 * @file API service for managing chat conversations.
 */

import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api/fetch';
import { CreateConversationDto, Conversation, GetConversationsDto } from '@/types/conversation';

// ────────────────────────────────────────────────────────────────────────────
// Chat Conversation REST API Functions
// ────────────────────────────────────────────────────────────────────────────

const CHAT_CONVERSATIONS_BASE_URL = `${API_BASE_URL}/chat/conversations`;

/**
 * API service for interacting with chat conversation endpoints.
 */
export const chatApi = {
  /**
   * Creates a new chat conversation on the backend.
   * @param data The data for creating the conversation (title, createdById).
   * @returns A promise that resolves to the created Conversation object.
   */
  createConversation: async (
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
  },

  /**
   * Retrieves a list of conversations for a specific user from the backend.
   * @param userId The ID of the user whose conversations are to be fetched.
   * @returns A promise that resolves to an array of Conversation objects.
   */
  getConversationsByUserId: async (
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
        error,
      );
      throw error;
    }
  },

  // Add other conversation-related API calls here (e.g., updateConversation, deleteConversation)
};