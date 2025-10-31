import { atom } from 'nanostores';
import type { IPlan } from '../types';
import {
  INSTRUCTION as PLANNER_AI_INSTRUCTION,
  INSTRUCTION_SCHEMA_OUTPUT as PLANNER_EXPECTED_OUTPUT_FORMAT,
} from '../constants/instructions';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

// Define a reasonable default project root path if none is set
// This path is specific to the user's environment, based on the project structure.
const DEFAULT_PROJECT_ROOT = '/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/text-to-speech';

// Initialize projectRootDirectoryStore with a default if it's empty
// This ensures that projectRootDirectoryStore.get() will always return a string or DEFAULT_PROJECT_ROOT
if (projectRootDirectoryStore.get() === null || projectRootDirectoryStore.get() === '') {
  projectRootDirectoryStore.set(DEFAULT_PROJECT_ROOT);
}

interface PlannerState {
  userPrompt: string;
  currentPlanId: string | null;
  plan: IPlan | null;
  isLoading: boolean;
  error: string | null;
  applyStatus: 'idle' | 'applying' | 'success' | 'failure';
  applyError: string | null;
  projectRoot: string; // New field for project root directory
  scanPathsInput: string; // New field for AI scan paths
  additionalInstructions: string; // New field for AI's additional instructions
  expectedOutputFormat: string; // New field for AI's expected output format
}

export const plannerStore = atom<PlannerState>({
  userPrompt: '',
  currentPlanId: null,
  plan: null,
  isLoading: false,
  error: null,
  applyStatus: 'idle',
  applyError: null,
  projectRoot: projectRootDirectoryStore.get() ?? DEFAULT_PROJECT_ROOT, // Ensure a default string value
  scanPathsInput: 'src, public, package.json, README.md, .env', // Provide sensible defaults for scan paths
  additionalInstructions: PLANNER_AI_INSTRUCTION, // Default from constants
  expectedOutputFormat: PLANNER_EXPECTED_OUTPUT_FORMAT, // Default from constants
});

export const setUserPrompt = (prompt: string) => {
  plannerStore.set({ ...plannerStore.get(), userPrompt: prompt });
};

export const setPlan = (planId: string | null, plan: IPlan | null) => {
  plannerStore.set({ ...plannerStore.get(), currentPlanId: planId, plan: plan, isLoading: false, error: null });
};

export const setIsLoading = (loading: boolean) => {
  plannerStore.set({ ...plannerStore.get(), isLoading: loading, error: null });
};

export const setError = (error: string | null) => {
  plannerStore.set({ ...plannerStore.get(), error: error, isLoading: false });
};

export const setApplyStatus = (status: PlannerState['applyStatus'], error: string | null = null) => {
  plannerStore.set({ ...plannerStore.get(), applyStatus: status, applyError: error });
};

export const setProjectRoot = (root: string) => {
  plannerStore.set({ ...plannerStore.get(), projectRoot: root });
};

export const setScanPathsInput = (paths: string) => {
  plannerStore.set({ ...plannerStore.get(), scanPathsInput: paths });
};

export const setAdditionalInstructions = (instructions: string) => {
  plannerStore.set({ ...plannerStore.get(), additionalInstructions: instructions });
};

export const setExpectedOutputFormat = (format: string) => {
  plannerStore.set({ ...plannerStore.get(), expectedOutputFormat: format });
};

export const resetPlannerState = () => {
  plannerStore.set({
    userPrompt: '',
    currentPlanId: null,
    plan: null,
    isLoading: false,
    error: null,
    applyStatus: 'idle',
    applyError: null,
    projectRoot: projectRootDirectoryStore.get() ?? DEFAULT_PROJECT_ROOT,
    scanPathsInput: 'src, public, package.json, README.md, .env', // Reset to default scan paths as well
    additionalInstructions: PLANNER_AI_INSTRUCTION,
    expectedOutputFormat: PLANNER_EXPECTED_OUTPUT_FORMAT,
  });
};
