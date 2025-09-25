import { map } from 'nanostores';
import { RequestType, LlmOutputFormat } from '@/constants/types';
import {
  LlmGeneratePayload,
  ModelResponse,
  FileChange,
} from '@/types/llm';
import {
  INSTRUCTION,
  YAML_INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants/instructions';

import { applyProposedChanges, generateCode } from '@/services/llm';

export interface AiEditorState {
  instruction: string;
  aiInstruction: string;
  expectedOutputInstruction: string;
  requestType: RequestType;
  llmOutputFormat: LlmOutputFormat;
  scanPathsInput: string;
  uploadedFileData: string | null;
  uploadedFileMimeType: string | null;
  currentProjectPath: string | null;
  response: string | null;
  lastLlmResponse: ModelResponse | null;
  lastLlmGeneratePayload: LlmGeneratePayload | null;
  selectedChanges: Record<string, FileChange>;
  currentDiff: string | null;
  diffFilePath: string | null;
  applyingChanges: boolean;
  autoApplyChanges: boolean;
  isBuilding: boolean;
  loading: boolean;
  error: string | null;
  snackbar: { open: boolean; message: string; severity?: 'success' | 'error' | 'info' | 'warning' };
}

export const aiEditorStore = map<AiEditorState>({
  instruction: '',
  aiInstruction: INSTRUCTION,
  expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
  requestType: RequestType.LLM_GENERATION,
  llmOutputFormat: LlmOutputFormat.YAML,
  scanPathsInput: 'src,package.json,README.md',
  uploadedFileData: null,
  uploadedFileMimeType: null,
  currentProjectPath: null,
  response: null,
  lastLlmResponse: null,
  lastLlmGeneratePayload: null,
  selectedChanges: {},
  currentDiff: null,
  diffFilePath: null,
  applyingChanges: false,
  autoApplyChanges: false,
  isBuilding: false,
  loading: false,
  error: null,
  snackbar: { open: false, message: '', severity: undefined },
});

// --- Generic setter ---
const setState = <K extends keyof AiEditorState>(key: K, value: AiEditorState[K]) => aiEditorStore.setKey(key, value);

// --- Scan Paths ---
export const setScanPathsInput = (paths: string) => setState('scanPathsInput', paths);
export const addScanPath = (path: string) => {
  const current = aiEditorStore.get().scanPathsInput.split(',').map(p => p.trim()).filter(Boolean);
  if (!path || current.includes(path)) return;
  setScanPathsInput([...current, path].join(','));
};
export const removeScanPath = (path: string) => {
  const current = aiEditorStore.get().scanPathsInput.split(',').map(p => p.trim()).filter(Boolean);
  setScanPathsInput(current.filter(p => p !== path).join(','));
};

// --- AI Instructions ---
export const setInstruction = (instruction: string) => setState('instruction', instruction);
export const setAiInstruction = (instruction: string) => setState('aiInstruction', instruction);
export const setExpectedOutputInstruction = (instruction: string) => setState('expectedOutputInstruction', instruction);
export const setRequestType = (type: RequestType) => setState('requestType', type);
export const setLlmOutputFormat = (format: LlmOutputFormat) => setState('llmOutputFormat', format);

// --- Project & File Upload ---
export const setCurrentProjectPath = (path: string) => setState('currentProjectPath', path);
export const setUploadedFile = (data: string | null, mimeType: string | null) => {
  setState('uploadedFileData', data);
  setState('uploadedFileMimeType', mimeType);
};

// --- Loading & Error ---
export const setLoading = (loading: boolean) => setState('loading', loading);
export const setIsBuilding = (isBuilding: boolean) => setState('isBuilding', isBuilding);
export const setError = (error: string | null) => setState('error', error);

// --- Response & LLM ---
export const setLastLlmGeneratePayload = (payload: LlmGeneratePayload | null) => setState('lastLlmGeneratePayload', payload);
export const setLastLlmResponse = (response: ModelResponse | null) => {
  setState('lastLlmResponse', response);
  if (!response?.changes) {
    setState('selectedChanges', {});
  } else {
    const selected: Record<string, FileChange> = {};
    response.changes.forEach(c => selected[c.filePath] = c);
    setState('selectedChanges', selected);
  }
};

// --- Selected Changes & Diff ---
export const setCurrentDiff = (filePath: string | null, diff: string | null) => {
  setState('diffFilePath', filePath);
  setState('currentDiff', diff);
};
export const toggleSelectedChange = (change: FileChange) => {
  const selected = { ...aiEditorStore.get().selectedChanges };
  if (selected[change.filePath]) delete selected[change.filePath];
  else selected[change.filePath] = change;
  setState('selectedChanges', selected);
};
export const clearSelectedChanges = () => setState('selectedChanges', {});

// --- Auto Apply ---
export const setAutoApplyChanges = (value: boolean) => setState('autoApplyChanges', value);
export const setApplyingChanges = (value: boolean) => setState('applyingChanges', value);

// --- Snackbar ---
export const showGlobalSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
  setState('snackbar', { open: true, message, severity });
};
export const hideGlobalSnackbar = () => setState('snackbar', { ...aiEditorStore.get().snackbar, open: false });

// --- Clear State ---
export const clearState = () => {
  aiEditorStore.set({
    instruction: '',
    aiInstruction: INSTRUCTION,
    expectedOutputInstruction: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
    requestType: RequestType.LLM_GENERATION,
    llmOutputFormat: LlmOutputFormat.YAML,
    scanPathsInput: 'src,package.json,README.md',
    uploadedFileData: null,
    uploadedFileMimeType: null,
    currentProjectPath: null,
    response: null,
    lastLlmResponse: null,
    lastLlmGeneratePayload: null,
    selectedChanges: {},
    currentDiff: null,
    diffFilePath: null,
    applyingChanges: false,
    autoApplyChanges: false,
    isBuilding: false,
    loading: false,
    error: null,
    snackbar: { open: false, message: '', severity: undefined },
  });
};

// --- Apply All Changes ---
export const applyAllProposedChanges = async (changes: FileChange[], projectRootPath: string) => {
  if (!changes.length) return;
  setApplyingChanges(true);
  try {
    for (const change of changes) {
      await applyProposedChanges(change, projectRootPath);
    }
    showGlobalSnackbar('All changes applied successfully.', 'success');
  } catch (err) {
    showGlobalSnackbar(`Failed to apply changes: ${err instanceof Error ? err.message : String(err)}`, 'error');
  } finally {
    setApplyingChanges(false);
  }
};

// --- AI Code Generation ---
export const generateCodeFromAI = async () => {
  const state = aiEditorStore.get();
  if (!state.instruction || !state.currentProjectPath) return;

  setLoading(true);
  setError(null);
  setLastLlmResponse(null);
  setCurrentDiff(null, null);
  setIsBuilding(false);

  try {
    const payload: LlmGeneratePayload = {
      userPrompt: state.instruction,
      projectRoot: state.currentProjectPath,
      projectStructure: '',
      relevantFiles: [],
      additionalInstructions: state.aiInstruction,
      expectedOutputFormat: state.expectedOutputInstruction,
      scanPaths: state.scanPathsInput.split(',').map(p => p.trim()).filter(Boolean),
      requestType: state.requestType,
      output: state.llmOutputFormat,
      ...(state.uploadedFileData && { fileData: state.uploadedFileData }),
      ...(state.uploadedFileMimeType && { fileMimeType: state.uploadedFileMimeType }),
    };

    setLastLlmGeneratePayload(payload);
    const aiResponse: ModelResponse = await generateCode(payload);
    setLastLlmResponse(aiResponse);
    showGlobalSnackbar('AI response generated!', 'success');

    if (state.autoApplyChanges && aiResponse.changes?.length && state.currentProjectPath) {
      await applyAllProposedChanges(aiResponse.changes, state.currentProjectPath);
    }
  } catch (err) {
    const msg = `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`;
    setError(msg);
    showGlobalSnackbar(msg, 'error');
  } finally {
    setLoading(false);
  }
};

