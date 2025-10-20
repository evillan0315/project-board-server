import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { Message } from '@/components/chat/types'; // Import Message interface

/**
 * An atom that holds the currently active conversation ID (UUID string).
 * If null, no conversation is active or one needs to be created.
 */
export const activeConversationId = persistentAtom<string | null>('activeConversationId', null);

/**
 * An atom that holds the visibility state of the video chat component.
 */
export const showVideoChat = persistentAtom<boolean>('showVideoChat', false);

/**
 * An atom that holds the list of messages for the active conversation.
 * It is not persistent as chat history is loaded from the backend per session.
 */
export const messages = atom<Message[]>([]);

/**
 * An atom indicating if a conversation is currently being created or loaded.
 */
export const conversationLoading = atom<boolean>(false);

/**
 * An atom holding an error message related to conversation creation or loading.
 */
export const conversationError = atom<string | null>(null);

/**
 * An atom indicating if conversation history is currently being loaded.
 * Initial state is true because history loading starts immediately upon connecting to a conversation.
 */
export const isHistoryLoading = atom<boolean>(true);

/**
 * An atom holding an error message related to loading conversation history.
 */
export const historyError = atom<string | null>(null);

/**
 * Sets the active conversation ID.
 * @param id The UUID of the conversation.
 */
export function setActiveConversationId(id: string | null) {
  activeConversationId.set(id);
}

/**
 * Clears the active conversation ID.
 */
export function clearActiveConversationId() {
  activeConversationId.set(null);
}

/**
 * Sets the visibility state of the video chat component.
 * @param value True to show video chat, false to hide.
 */
export function setShowVideoChat(value: boolean) {
  showVideoChat.set(value);
}

/**
 * Sets or updates the list of messages for the active conversation.
 * It can take either a new array directly or a function that takes the previous state and returns a new array.
 * @param newMessages The new array of messages or a function that takes the previous state and returns a new array.
 */
export function setMessages(newMessages: Message[] | ((prev: Message[]) => Message[])) {
  if (typeof newMessages === 'function') {
    messages.set(newMessages(messages.get()));
  } else {
    messages.set(newMessages);
  }
}

/**
 * Sets the loading state for conversation creation/initialization.
 * @param value True if loading, false otherwise.
 */
export function setConversationLoading(value: boolean) {
  conversationLoading.set(value);
}

/**
 * Sets an error message related to conversation creation/initialization.
 * @param value The error message string, or null to clear.
 */
export function setConversationError(value: string | null) {
  conversationError.set(value);
}

/**
 * Sets the loading state for fetching conversation history.
 * @param value True if history is loading, false otherwise.
 */
export function setIsHistoryLoading(value: boolean) {
  isHistoryLoading.set(value);
}

/**
 * Sets an error message related to fetching conversation history.
 * @param value The error message string, or null to clear.
 */
export function setHistoryError(value: string | null) {
  historyError.set(value);
}
