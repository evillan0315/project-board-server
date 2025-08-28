import { map } from 'nanostores';
import { AiEditorState, ProposedFileChange } from '@/types';
import { LlmResponse } from '@/types/llm';

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
  currentProjectPath: null, // Initialized to null, will be set from VITE_BASE_DIR or user input
  response: null,
  loading: false,
  error: null,
  scanPathsInput: 'src,package.json,README.md', // Initialize with default scan paths
  lastLlmResponse: null, // Stores the full structured response from LLM
  selectedChanges: {}, // Map of filePath to ProposedFileChange for selected items
  currentDiff: null, // The content of the diff for the currently viewed file
  diffFilePath: null, // The filePath of the file whose diff is currently displayed
  applyingChanges: false, // New state for tracking if changes are being applied
  appliedMessages: [], // Messages from the backend after applying changes
});

export const setInstruction = (instruction: string) => {
  aiEditorStore.setKey('instruction', instruction);
};

export const setResponse = (response: string | null) => {
  aiEditorStore.setKey('response', response);
};

export const setLoading = (isLoading: boolean) => {
  aiEditorStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  aiEditorStore.setKey('error', message);
};

export const clearState = () => {
  aiEditorStore.set({
    instruction: '',
    currentProjectPath: null,
    response: null,
    loading: false,
    error: null,
    scanPathsInput: 'src,package.json,README.md', // Reset to default scan paths as well
    lastLlmResponse: null,
    selectedChanges: {},
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    appliedMessages: [],
  });
};

export const setScanPathsInput = (paths: string) => {
  aiEditorStore.setKey('scanPathsInput', paths);
};

export const setLastLlmResponse = (response: LlmResponse | null) => {
  aiEditorStore.setKey('lastLlmResponse', response);
  // Auto-select all changes when a new response comes in
  if (response && response.changes) {
    const newSelectedChanges: Record<string, ProposedFileChange> = {};
    response.changes.forEach((change) => {
      newSelectedChanges[change.filePath] = change;
    });
    aiEditorStore.setKey('selectedChanges', newSelectedChanges);
  } else {
    aiEditorStore.setKey('selectedChanges', {});
  }
};

export const toggleSelectedChange = (change: ProposedFileChange) => {
  aiEditorStore.set((state) => {
    const newSelected = { ...state.selectedChanges };
    if (newSelected[change.filePath]) {
      delete newSelected[change.filePath];
    } else {
      newSelected[change.filePath] = change;
    }
    return { ...state, selectedChanges: newSelected };
  });
};

export const selectAllChanges = () => {
  aiEditorStore.set((state) => {
    if (state.lastLlmResponse?.changes) {
      const newSelectedChanges: Record<string, ProposedFileChange> = {};
      state.lastLlmResponse.changes.forEach((change) => {
        newSelectedChanges[change.filePath] = change;
      });
      return { ...state, selectedChanges: newSelectedChanges };
    }
    return state;
  });
};

export const deselectAllChanges = () => {
  aiEditorStore.setKey('selectedChanges', {});
};

export const setCurrentDiff = (filePath: string | null, diffContent: string | null) => {
  aiEditorStore.setKey('diffFilePath', filePath);
  aiEditorStore.setKey('currentDiff', diffContent);
};

export const clearDiff = () => {
  aiEditorStore.setKey('currentDiff', null);
  aiEditorStore.setKey('diffFilePath', null);
};

export const setApplyingChanges = (isApplying: boolean) => {
  aiEditorStore.setKey('applyingChanges', isApplying);
};

export const setAppliedMessages = (messages: string[]) => {
  aiEditorStore.setKey('appliedMessages', messages);
};
