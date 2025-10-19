/**
 * @file Nanostore for managing the active conversation ID.
 */

import { atom } from 'nanostores';

/**
 * An atom that holds the currently active conversation ID (UUID string).
 * If null, no conversation is active or one needs to be created.
 */
export const activeConversationId = atom<string | null>(null);

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
