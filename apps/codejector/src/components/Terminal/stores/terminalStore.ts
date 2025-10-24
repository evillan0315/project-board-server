/**
 * FilePath: src/components/Terminal/stores/terminalStore.ts
 * Title: Terminal Store with WebGL Rendering and Deduplicated Output
 * Reason: Enhance terminal responsiveness with @xterm/addon-webgl while maintaining
 *         clean deduplication logic for spinner frames and repetitive socket output.
 */

import { map } from 'nanostores';
import { socketService } from '@/services/socketService';
import { persistentAtom } from '@/utils/persistentAtom';
import { SystemInfo, PromptData } from './types/terminal';
import stripAnsi from 'strip-ansi';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { getToken } from '@/stores/authStore';

// ──────────────────────────────────────────────
// State Definition
// ──────────────────────────────────────────────

export interface TerminalState {
  currentPath: string;
  systemInfo: string | null;
  isConnected: boolean;
  commandHistory: string[];
  historyIndex: number;
  output: string[];
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
  projectRootDirectoryStore.set(path);
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

  // Spinner frames
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

  // Handle spinner animation
  if (spinnerFrames.includes(trimmed)) {
    if (spinnerFrames.includes(lastLine)) {
      output[output.length - 1] = plainText;
    } else {
      output.push(plainText);
    }
  }
  // Handle new, distinct output
  else if (
    trimmed !== lastLine &&
    !lastLine.endsWith(trimmed) &&
    !trimmed.endsWith(lastLine)
  ) {
    output.push(plainText);
  }

  // Keep terminal memory bounded
  if (output.length > 5000) output.splice(0, output.length - 5000);

  terminalStore.set({ ...state, output });
};

// ──────────────────────────────────────────────
// Socket Lifecycle
// ──────────────────────────────────────────────

export const clearOutput = () => terminalStore.setKey('output', []);

export const connectTerminal = async () => {
  const token = getToken();
  if (!token) throw new Error('No authentication token.');

  const projectRoot = projectRootDirectoryStore.get();

  try {
    await socketService.connect(token, projectRoot);
    setConnected(true);
    clearOutput();

    socketService.on('output', appendOutput);
    socketService.on('outputMessage', appendOutput);
    socketService.on('error', (data: string) =>
      appendOutput(`Error: ${data}`),
    );

    socketService.on('outputInfo', (data: SystemInfo) => {
      const formatted = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      setSystemInfo(`${formatted}\n`);
    });

    socketService.on('prompt', (data: PromptData) =>
      setCurrentPath(data.cwd),
    );

    appendOutput('\x1b[32mConnected to terminal server.\x1b[0m\n');
  } catch (error) {
    appendOutput(`\x1b[31mConnection error:\x1b[0m ${error}\n`);
    throw error;
  }
};

export const disconnectTerminal = () => {
  socketService.disconnect();
  setConnected(false);
  appendOutput('\x1b[33mDisconnected from terminal server.\x1b[0m\n');
};

export const executeCommand = (command: string) => {
  if (!command.trim()) return;
  addCommandToHistory(command);
  socketService.execCommand(command);
};

export const resizeTerminal = (cols: number, rows: number) => {
  if (terminalStore.get().isConnected) {
    socketService.resize(cols, rows);
  }
};
