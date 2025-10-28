import { map } from 'nanostores';
import { IChatMessage } from '@/components/swingers/types';

/**
 * @interface IChatRoomState
 * @description Represents the state of the chat room Nanostore.
 * @property {IChatMessage[]} messages - An array of chat messages.
 * @property {boolean} loading - Indicates if a chat-related operation is in progress.
 * @property {string | null} error - Stores any error message encountered during chat operations.
 */
export interface IChatRoomState {
  messages: IChatMessage[];
  loading: boolean;
  error: string | null;
}

/**
 * @const chatStore
 * @description Nanostore for managing chat messages and state within an OpenVidu session.
 */
export const chatStore = map<IChatRoomState>({
  messages: [],
  loading: false,
  error: null,
});

/**
 * @function addChatMessage
 * @description Adds a new chat message to the store.
 * @param {IChatMessage} message - The message object to add.
 */
export const addChatMessage = (message: IChatMessage) => {
  chatStore.setKey('messages', [...chatStore.get().messages, message]);
};

/**
 * @function setChatLoading
 * @description Sets the loading state for chat operations.
 * @param {boolean} loading - The loading state.
 */
export const setChatLoading = (loading: boolean) => {
  chatStore.setKey('loading', loading);
};

/**
 * @function setChatError
 * @description Sets an error message for chat operations.
 * @param {string | null} error - The error message.
 */
export const setChatError = (error: string | null) => {
  chatStore.setKey('error', error);
};

/**
 * @function clearChat
 * @description Clears all messages from the chat store and resets loading/error states.
 */
export const clearChat = () => {
  chatStore.set({
    messages: [],
    loading: false,
    error: null,
  });
};
