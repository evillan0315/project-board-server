import { atom, map } from 'nanostores';
import type { ReactNode } from 'react';
import type { Breakpoint } from '@mui/material';

// -----------------------------------------------------------------------------
// Dialog Store Types
// -----------------------------------------------------------------------------
export interface DialogState {
  open: boolean;
  title: string | ReactNode;
  content: ReactNode | null;
  actions: ReactNode | null;
  maxWidth: Breakpoint | false;
  fullWidth: boolean;
  onClose?: () => void; // Optional callback when dialog requests close
  disableBackdropClick?: boolean; // If true, clicking backdrop doesn't close
  disableEscapeKeyDown?: boolean; // If true, Escape key doesn't close
  showCloseButton?: boolean; // If true, GlobalDialog will render a close button in title
  paperPropsSx?: object; // Custom sx for PaperProps
}

// -----------------------------------------------------------------------------
// Dialog Store
// -----------------------------------------------------------------------------
export const dialogStore = map<DialogState>({
  open: false,
  title: '',
  content: null,
  actions: null,
  maxWidth: 'sm',
  fullWidth: false,
  onClose: undefined,
  disableBackdropClick: false,
  disableEscapeKeyDown: false,
  showCloseButton: true,
  paperPropsSx: {},
});

/**
 * Displays a global dialog with the specified content and configuration.
 * @param config Configuration for the dialog (title, content, actions, etc.).
 */
export function showDialog(config: Partial<DialogState>): void {
  dialogStore.set({
    ...dialogStore.get(), // Keep current defaults if not overridden
    open: true,
    ...config,
  });
}

/**
 * Hides the currently open global dialog.
 * If an `onClose` callback was provided when the dialog was shown, it will be executed.
 */
export function hideDialog(): void {
  const currentOnClose = dialogStore.get().onClose;
  dialogStore.set({
    open: false,
    title: '',
    content: null,
    actions: null,
    maxWidth: 'sm',
    fullWidth: false,
    onClose: undefined,
    disableBackdropClick: false,
    disableEscapeKeyDown: false,
    showCloseButton: true,
    paperPropsSx: {},
  });
  if (currentOnClose) {
    currentOnClose();
  }
}
