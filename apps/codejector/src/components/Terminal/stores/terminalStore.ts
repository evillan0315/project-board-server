/**
 * FilePath: src/components/Terminal/stores/terminalStore.ts
 * Title: Terminal Store with WebGL Rendering and Deduplicated Output
 * Reason: Enhance terminal responsiveness with @xterm/addon-webgl while maintaining
 *         clean deduplication logic for spinner frames and repetitive socket output.
 *         Refactored to use `terminalSocketService` for all direct socket interactions,
 *         focusing this store on managing the UI-related state of the terminal session.
 */

import { map } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { SystemInfo, PromptData } from '../types/terminal';
import stripAnsi from 'strip-ansi';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { getToken } from '@/stores/authStore';
import { terminalSocketService } from '@/components/Terminal/services/terminalSocketService'; // NEW: Import the new service

// ──────────────────────────────────────────────
// State Definition
// ──────────────────────────────────────────────

export interface TerminalState {
  currentPath: string;
  systemInfo: string | null;
  isConnected: boolean;
  commandHistory: string[];
  historyIndex: number;
  output: string[]; // This stores plain text output for history/display
}

export const isTerminalVisible = persistentAtom<boolean>('showTerminal', false);
export const setShowTerminal = (show: boolean) => isTerminalVisible.set(show);

export const terminalStore = map<TerminalState>({
  currentPath: '~',
  systemInfo: null,
  isConnected: false,
  commandHistory: [],
  historyIndex: -1,
  output: [],
});

// ──────────────────────────────────────────────
// Basic Mutations
// ──────────────────────────────────────────────

export const setCurrentPath = (path: string) => {
  projectRootDirectoryStore.set(path); // Update global project root store
  terminalStore.setKey('currentPath', path); // Also update local terminal store
};

export const setSystemInfo = (info: string) => {
  terminalStore.setKey('systemInfo', info);
};

export const setConnected = (isConnected: boolean) => {
  terminalStore.setKey('isConnected', isConnected);
};

export const addCommandToHistory = (command: string) => {
  const state = terminalStore.get();
  const updatedHistory = [...state.commandHistory, command];
  terminalStore.set({
    ...state,
    commandHistory: updatedHistory,
    historyIndex: updatedHistory.length,
  });
};

export const browseHistory = (direction: 'up' | 'down') => {
  const state = terminalStore.get();
  let newIndex = state.historyIndex;

  newIndex =
    direction === 'up'
      ? Math.max(0, newIndex - 1)
      : Math.min(state.commandHistory.length - 1, newIndex + 1);

  terminalStore.setKey('historyIndex', newIndex);
};

export const resetHistoryIndex = () => terminalStore.setKey('historyIndex', -1);

// ──────────────────────────────────────────────
// Output Deduplication (Spinner-Aware)
// ──────────────────────────────────────────────

export const appendOutput = (text: string) => {
  const plainText = stripAnsi(text).replace(/\r/g, '');
  const trimmed = plainText.trim();
  if (!trimmed) return;

  const state = terminalStore.get();
  const output = [...state.output];
  const lastLine = output[output.length - 1]?.trim() ?? '';

  // Spinner frames common in terminal loading animations
  const spinnerFrames = [
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
    '⠋',
  ];

  // Handle spinner animation to avoid duplicating frames in history
  if (spinnerFrames.includes(trimmed)) {
    if (spinnerFrames.includes(lastLine)) {
      output[output.length - 1] = plainText; // Replace last spinner frame
    } else {
      output.push(plainText); // Add new spinner frame
    }
  }
  // Handle new, distinct output: append if not a duplicate or partial match
  else if (
    trimmed !== lastLine &&
    !lastLine.endsWith(trimmed) &&
    !trimmed.endsWith(lastLine)
  ) {
    output.push(plainText);
  }

  // Keep terminal output history bounded to prevent excessive memory usage
  if (output.length > 5000) output.splice(0, output.length - 5000);

  terminalStore.set({ ...state, output });
};

// ──────────────────────────────────────────────
// Socket Lifecycle Orchestration
// ──────────────────────────────────────────────

export const clearOutput = () => terminalStore.setKey('output', []);

export const connectTerminal = async () => {
  try {
    // Orchestrate the connection using the dedicated terminal socket service
    await terminalSocketService.connect();
    // Update global store state upon successful connection
    setConnected(true);
    clearOutput(); // Clear historical output for a fresh session
    appendOutput('\x1b[36mProject Terminal Ready\x1b[0m');
    appendOutput('---------------------------------------');
    appendOutput('\x1b[32mConnected to terminal server.\x1b[0m\n');
  } catch (error) {
    // Handle connection error: update store state and append an error message
    console.error('Terminal connection failed:', error);
    setConnected(false);
    appendOutput(`\x1b[31mConnection error:\x1b[0m ${error instanceof Error ? error.message : String(error)}\n`);
    throw error; // Re-throw the error for upstream components (e.g., XTerminal) to handle if needed
  }
};

export const disconnectTerminal = () => {
  // Orchestrate the disconnection using the dedicated terminal socket service
  terminalSocketService.disconnect();
  // Update global store state upon disconnection
  setConnected(false);
  appendOutput('\x1b[33mDisconnected from terminal server.\x1b[0m\n');
};

export const executeCommand = (command: string) => {
  if (!command.trim()) return;
  addCommandToHistory(command);
  terminalSocketService.execCommand(command); // Use new service for command execution
};

export const resizeTerminal = (cols: number, rows: number) => {
  if (terminalStore.get().isConnected) {
    terminalSocketService.resize(cols, rows); // Use new service for resizing
  }
};
