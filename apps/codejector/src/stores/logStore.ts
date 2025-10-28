/**
 * FilePath: src/stores/logStore.ts
 * Title: Global Log Store with JSON Output Support
 * Reason: Update LogEntry and addLog to handle structured JSON stdout/stderr
 *         from TerminalCommandResponse for consistent and readable terminal logs.
 */

import { atom } from 'nanostores';
import { nanoid } from 'nanoid';
import { TerminalCommandResponse } from '@/types';

/**
 * Interface for a single log entry.
 */
export interface LogEntry {
  id: string; // Unique ID for React keys
  timestamp: string; // Formatted time of the log
  source: string; // Component or process that generated the log (e.g., 'Prompt Generator', 'AI Response Display', 'Build Process')
  message: string; // A concise summary message for the log
  severity: 'info' | 'warning' | 'error' | 'success' | 'debug'; // Level of importance
  details?: string; // More verbose information, stack trace, etc.
  rawOutput?: TerminalCommandResponse; // Structured command output (stdout, stderr, exitCode)
  alwaysExpanded?: boolean; // If this log should always be expanded in the UI (useful for errors/warnings)
}

/**
 * Nanostore to hold all log entries.
 * It's an array of LogEntry, allowing for a chronological list of events.
 */
export const logStore = atom<LogEntry[]>([]);

/**
 * Adds a new log entry to the global log store.
 * @param source The source component or process (e.g., 'Prompt Generator').
 * @param message A concise summary of the event.
 * @param severity The severity level ('info', 'warning', 'error', 'success', 'debug'). Defaults to 'info'.
 * @param details Optional, more verbose details for the log entry.
 * @param rawOutput Optional, structured terminal command response for command-specific logs.
 * @param alwaysExpanded Optional, if the log accordion should be expanded by default. Defaults to true for errors/warnings.
 */
export const addLog = (
  source: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'success' | 'debug' = 'info',
  details?: string,
  rawOutput?: TerminalCommandResponse,
  alwaysExpanded?: boolean,
) => {
  let formattedDetails = details;

  // Format structured command output into readable string if available
  if (rawOutput) {
    const formattedStdout =
      rawOutput.stdout && rawOutput.stdout.length > 0
        ? JSON.stringify(rawOutput.stdout, null, 2)
        : '(no stdout)';

    const formattedStderr =
      rawOutput.stderr && rawOutput.stderr.length > 0
        ? JSON.stringify(rawOutput.stderr, null, 2)
        : '(no stderr)';

    const combinedDetails = `Stdout:\n${formattedStdout}\n\nStderr:\n${formattedStderr}\n\nExit Code: ${rawOutput.exitCode}`;

    // If `details` was provided, append it below the structured output
    formattedDetails = details
      ? `${details}\n\n${combinedDetails}`
      : combinedDetails;
  }

  const newLog: LogEntry = {
    id: nanoid(),
    timestamp: new Date().toLocaleTimeString(),
    source,
    message,
    severity,
    details: formattedDetails,
    rawOutput,
    alwaysExpanded:
      alwaysExpanded !== undefined
        ? alwaysExpanded
        : severity === 'error' || severity === 'warning',
  };

  logStore.set([...logStore.get(), newLog]);
  // console.log(`[${newLog.timestamp}][${newLog.source} - ${newLog.severity.toUpperCase()}] ${newLog.message}`);
};

/**
 * Clears all log entries from the store.
 */
export const clearLogs = () => {
  logStore.set([]);
  addLog('System', 'All logs cleared.', 'info');
};
