import { map } from 'nanostores';

/**
 * Shape of the error store state.
 * Extend later (e.g., severity, timestamp) if needed.
 */
export interface ErrorStoreState {
  /** Latest error message to display or log. */
  raw: string | null;
  message: string | null;
}

export const errorStore = map<ErrorStoreState>({
  raw: null,
  message: null,
});

/**
 * Set a new error message.
 * Also suitable for use in catch blocks or validation failures.
 */
export function setError(message: string): void {
  errorStore.setKey('message', message);
}
export function setErrorRaw(raw: string): void {
  errorStore.setKey('raw', raw);
}
/**
 * Clear the current error message.
 * Useful after the UI shows a toast or alert.
 */
export function clearError(): void {
  errorStore.setKey('message', null);
}
