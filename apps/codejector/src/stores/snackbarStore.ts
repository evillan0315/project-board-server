/**
 * FilePath: src/stores/snackbarStore.ts
 * Title: Global Snackbar Store with Logging Integration
 * Reason: Provides a globally accessible snackbar (toast) state using Nanostores,
 *          enabling consistent user notifications across the application and
 *          automatic integration with the global log store.
 */

import { atom } from 'nanostores';
import { addLog } from './logStore';

/**
 * Allowed snackbar severities for clarity and type-safety.
 * Mirrors Material UI's supported snackbar alert types.
 */
export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

/**
 * Describes the current state of the global snackbar.
 */
export interface SnackbarState {
  open: boolean; // Whether the snackbar is visible
  message: string; // The message displayed in the snackbar
  severity: SnackbarSeverity; // Type of snackbar for visual styling
}

/**
 * Nanostore atom representing the global snackbar state.
 */
export const snackbarState = atom<SnackbarState>({
  open: false,
  message: '',
  severity: 'info',
});

/**
 * Updates the snackbar state partially without overwriting all fields.
 * @param newState Partial state to merge into the existing snackbar state.
 */
export function setSnackbarState(newState: Partial<SnackbarState>): void {
  snackbarState.set({
    ...snackbarState.get(),
    ...newState,
  });
}

/**
 * Logs snackbar-related events to the centralized logging store.
 * @param message The snackbar message.
 * @param severity The snackbar severity level.
 */
function logSnackbarEvent(message: string, severity: SnackbarSeverity): void {
  const logSource = 'UI Notification';
  const formattedMessage = `Snackbar ${severity.toUpperCase()}: ${message}`;

  addLog(logSource, formattedMessage, severity, message);
}

/**
 * Displays a global snackbar notification and logs the event.
 * @param message The message to display in the snackbar.
 * @param severity The snackbar type (e.g., 'success', 'error').
 */
export function showGlobalSnackbar(
  message: string,
  severity: SnackbarSeverity,
): void {
  snackbarState.set({
    open: true,
    message,
    severity,
  });

  // Log snackbar activity for audit or debugging purposes.
  logSnackbarEvent(message, severity);
}

/**
 * Hides the global snackbar and resets its state.
 */
export function hideGlobalSnackbar(): void {
  snackbarState.set({
    open: false,
    message: '',
    severity: 'info',
  });
}
