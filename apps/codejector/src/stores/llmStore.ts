import { map } from 'nanostores';
import {
  FileChange,
  AddOrModifyFileChange,
  LlmOutputFormat,
  LlmGeneratePayload,
  RequestType,
  ModelResponse,
} from '@/types/llm';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants/instruction';
import { applyProposedChanges } from '@/api/llm';
import { addLog } from '@/stores/logStore';
import { ErrorStoreState, errorStore, setError } from '@/stores/errorStore';
import { runTerminalCommand } from '@/api/terminal';

export interface LlmStoreState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  response: string | null;
  loading: boolean;
  errorLlm: string | null; // Changed to string | null
  scanPathsInput: string;
  lastLlmResponse: ModelResponse | null;
  lastLlmGeneratePayload: LlmGeneratePayload | null;
  lastLlmGeneratePayloadString: string | null;
  selectedChanges: Record<string, FileChange>;
  currentDiff: string | null;
  diffFilePath: string | null;
  applyingChanges: boolean;
  gitInstructions: string[] | null;
  isBuilding: boolean;
}

const INITIAL_LLM_STORE_STATE: LlmStoreState = {
  instruction: '',
  aiInstruction: INSTRUCTION,
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  requestType: RequestType.LLM_GENERATION,
  llmOutputFormat: LlmOutputFormat.JSON, // or YAML if preferred

  response: null,
  loading: false,
  errorLlm: null, // Initial state set to null
  scanPathsInput: 'eslint.config.ts, vite.config.ts, package.json,README.md',
  lastLlmResponse: null,
  lastLlmGeneratePayload: null,
  lastLlmGeneratePayloadString: null,
  selectedChanges: {},
  currentDiff: null,
  diffFilePath: null,
  applyingChanges: false,
  gitInstructions: null,
  isBuilding: false,
};

export const llmStore = map<LlmStoreState>(INITIAL_LLM_STORE_STATE);

/**
 * Clears all LLM store state to its initial values.
 */
export const clearLlmStore = () => {
  llmStore.set(INITIAL_LLM_STORE_STATE);
  addLog('LLM Store', 'LLM store state cleared.', 'info');
};

/**
 * Set loading state for LLM generation
 */
export const setLoading = (isLoading: boolean) => {
  const state = llmStore.get();
  llmStore.set({ ...state, loading: isLoading });

  if (isLoading) {
    addLog('AI Generation', 'LLM generation started...', 'info');
  } else {
    addLog('AI Generation', 'LLM generation finished.', 'info');
  }
};

// ────────────────────────────
// Basic setters
// ────────────────────────────
export const setInstruction = (instruction: string) =>
  llmStore.setKey('instruction', instruction);

export const setAiInstruction = (instruction: string) =>
  llmStore.setKey('aiInstruction', instruction);

export const setExpectedOutputInstruction = (instruction: string) =>
  llmStore.setKey('expectedOutputInstruction', instruction);

export const setRequestType = (type: RequestType) =>
  llmStore.setKey('requestType', type);

export const setLlmOutputFormat = (format: LlmOutputFormat) =>
  llmStore.setKey('llmOutputFormat', format);

export const setScanPathsInput = (paths: string) =>
  llmStore.setKey('scanPathsInput', paths);

export const setLastLlmGeneratePayload = (
  payload: LlmGeneratePayload | null,
) => {
  llmStore.setKey('lastLlmGeneratePayload', payload);
};
export const setLlmError = (
  error: string | null, // Changed type to string | null
) => llmStore.setKey('errorLlm', error);

export const setLlmResponse = (response: string) =>
  llmStore.setKey('response', response);
// ────────────────────────────
// Safe setter for last LLM response
// ────────────────────────────
export const setLastLlmResponse = (response: ModelResponse | null) => {
  if (!response) {
    llmStore.setKey('lastLlmResponse', null);
    return;
  }

  // Ensure error is a string, changes and gitInstructions are arrays
  const safeResponse: ModelResponse = {
    ...response,
    error:
      typeof response.error === 'string'
        ? response.error
        : (response.error?.message ?? null),
    changes: Array.isArray(response.changes) ? response.changes : [],
    gitInstructions: Array.isArray(response.gitInstructions)
      ? response.gitInstructions
      : [],
  };

  llmStore.setKey('lastLlmResponse', safeResponse);
};

// ────────────────────────────
// Change selection and diff
// ────────────────────────────
export const selectAllChanges = () => {
  const state = llmStore.get();
  if (state.lastLlmResponse?.changes) {
    const all: Record<string, FileChange> = {};
    state.lastLlmResponse.changes.forEach((c) => (all[c.filePath] = c));
    llmStore.setKey('selectedChanges', all);
  }
};

export const deselectAllChanges = () => llmStore.setKey('selectedChanges', {});

export const setCurrentDiff = (
  filePath: string | null,
  diff: string | null,
) => {
  llmStore.setKey('diffFilePath', filePath);
  llmStore.setKey('currentDiff', diff);
};

export const clearDiff = () => {
  llmStore.setKey('diffFilePath', null);
  llmStore.setKey('currentDiff', null);
};

export const setApplyingChanges = (isApplying: boolean) =>
  llmStore.setKey('applyingChanges', isApplying);

// ────────────────────────────
// Update proposed changes
// ────────────────────────────
export const updateProposedChangeContent = (
  filePath: string,
  newContent: string,
) => {
  const state = llmStore.get();
  if (!state.lastLlmResponse) return;

  const updated = state.lastLlmResponse.changes.map((ch) =>
    ch.filePath === filePath && ['add', 'modify', 'repair'].includes(ch.action)
      ? ({ ...(ch as AddOrModifyFileChange), newContent } as FileChange) // Explicitly cast to FileChange
      : ch,
  );

  const newSelected = { ...state.selectedChanges };
  const sel = newSelected[filePath];
  if (sel && ['add', 'modify', 'repair'].includes(sel.action)) {
    newSelected[filePath] = {
      ...(sel as AddOrModifyFileChange),
      newContent,
    } as FileChange; // Explicitly cast to FileChange
  }

  llmStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
  });
  addLog('Proposed Change Card', `Content updated for: ${filePath}`, 'debug');
};

export const updateProposedChangePath = (oldPath: string, newPath: string) => {
  const state = llmStore.get();
  if (!state.lastLlmResponse) {
    setError('Cannot update path: no LLM response.');
    return;
  }

  const trimmed = newPath.trim();
  if (!trimmed) {
    setError('New file path cannot be empty.');
    return;
  }
  if (trimmed === oldPath) return;

  let found = false;
  const updated = state.lastLlmResponse.changes.map((ch) => {
    if (ch.filePath === oldPath) {
      found = true;
      return { ...ch, filePath: trimmed };
    }
    return ch;
  });

  if (!found) {
    setError(`Change for path '${oldPath}' not found.`);
    return;
  }

  const newSelected = { ...state.selectedChanges };
  if (newSelected[oldPath]) {
    newSelected[trimmed] = { ...newSelected[oldPath], filePath: trimmed };
    delete newSelected[oldPath];
  }

  let newDiff = state.currentDiff;
  let newDiffPath = state.diffFilePath;
  if (newDiffPath === oldPath) {
    newDiffPath = null;
    newDiff = null;
  }

  llmStore.set({
    ...state,
    lastLlmResponse: { ...state.lastLlmResponse, changes: updated },
    selectedChanges: newSelected,
    diffFilePath: newDiffPath,
    currentDiff: newDiff,
  });
  addLog(
    'Proposed Change Card',
    `File path updated from '${oldPath}' to '${trimmed}'.`,
    'info',
  );
};
export const setIsBuilding = (building: boolean) => {
  llmStore.setKey('isBuilding', building);
  addLog(
    'Build Process',
    building ? 'Build script started...' : 'Build script finished.',
    'info',
  );
};
export const performPostApplyActions = async (
  projectRoot: string,
  changes: FileChange[],
  llmGeneratePayload: LlmGeneratePayload,
  llmResponse: ModelResponse,
) => {
  if (llmResponse?.gitInstructions?.length) {
    addLog(
      'Git Automation',
      'Executing AI-suggested git instructions...',
      'info',
    );
    let gitCommandsSuccessful = true;
    for (const command of llmResponse.gitInstructions) {
      addLog('Git Automation', `Running git command: \`${command}\``, 'info');
      try {
        const gitExecResult = await runTerminalCommand(command, projectRoot);

        if (gitExecResult.exitCode !== 0) {
          const errMsg = `Git command failed: \`${command}\` (Exit Code: ${gitExecResult.exitCode}).`;
          addLog('Git Automation', errMsg, 'error');
          setError(errMsg);
          gitCommandsSuccessful = false;
          break;
        } else {
          addLog(
            'Git Automation',
            `Git command succeeded: \`${command}\`.`,
            'success',
          );
        }
      } catch (err) {
        const errMsg = `Failed to execute git command \`${command}\`: ${err instanceof Error ? err.message : String(err)}`;
        addLog('Git Automation ', errMsg, 'error');
        setError(errMsg);
        gitCommandsSuccessful = false;
        break;
      }
    }

    if (gitCommandsSuccessful) {
      addLog(
        'Git Automation',
        'All git instructions executed successfully.',
        'success',
      );
    }
  }

  // Apply proposed changes via API
  try {
    await applyProposedChanges(changes, projectRoot);
    addLog(
      'Post Apply',
      'Proposed changes applied and scan completed.',
      'success',
    );
  } catch (err) {
    const errMsg = `Failed to apply proposed changes: ${err instanceof Error ? err.message : String(err)}`;
    addLog('Post Apply', errMsg, 'error');
    setError(errMsg);
  }
};
export * from './snackbarStore';
