// src/stores/conversationStore.ts

import { map } from 'nanostores';
import { getConversations } from '@/api/conversation';
import { ConversationSummaryDto } from '@/types/conversation';

interface ConversationState {
  conversations: ConversationSummaryDto[];
  isLoading: boolean;
  error: string | null;
  selectedConversationId: string | null;
}

export const conversationStore = map<ConversationState>({
  conversations: [],
  isLoading: false,
  error: null,
  selectedConversationId: null,
});

/**
 * Loads conversations from the API and updates the store.
 */
export async function loadConversations() {
  conversationStore.set({
    ...conversationStore.get(),
    isLoading: true,
    error: null,
  });
  try {
    // You can pass paginationDto here if needed, e.g., { page: 1, limit: 100 }
    const response = await getConversations({ page: 1, limit: 50 });
    conversationStore.set({
      ...conversationStore.get(),
      conversations: response.data,
      isLoading: false,
    });
  } catch (error) {
    console.error('Failed to load conversations:', error);
    conversationStore.set({
      ...conversationStore.get(),
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
      isLoading: false,
    });
  }
}

/**
 * Selects a conversation by its ID.
 * @param conversationId The ID of the conversation to select.
 */
export function selectConversation(conversationId: string | null) {
  conversationStore.setKey('selectedConversationId', conversationId);
}
