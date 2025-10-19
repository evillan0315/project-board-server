/**
 * @file API service for managing chat conversations.
 */

import axios from 'axios';

// Assuming your backend API base URL is configured in vite.config.ts or .env
// If not, explicitly define it here, e.g., 'http://localhost:3000'
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface CreateConversationDto {
  title: string;
  createdById: string;
}

interface ConversationResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

/**
 * Service for interacting with the chat conversation API.
 */
export const conversationApi = {
  /**
   * Creates a new conversation on the backend.
   * @param data The conversation creation data.
   * @param token The JWT token for authentication.
   * @returns A Promise resolving to the created conversation.
   */
  createConversation: async (data: CreateConversationDto, token: string): Promise<ConversationResponse> => {
    const response = await axios.post<ConversationResponse>(
      `${API_BASE_URL}/chat/conversations`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Add other conversation-related API calls here (e.g., getConversationHistory, updateConversation)
};
