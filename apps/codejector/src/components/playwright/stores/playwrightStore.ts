import { atom } from 'nanostores';
import { IPlaywrightOutputDto, INavigationStepDto } from '../types/IPlaywrightTypes'; // Updated import for PlaywrightOutputDto

// Defining IPlaywrightState here to avoid circular dependency with IPlaywrightTypes if IPlaywrightTypes were to import this.
// If IPlaywrightTypes needs IPlaywrightState, then IPlaywrightState should be in a separate file (e.g., store.types.ts)
// or keep it internal to the store file.
export interface IPlaywrightState {
  loading: boolean;
  error: string | null;
  results: IPlaywrightOutputDto | null;
  currentUrl: string;
  activeRecording: boolean;
  recordingFileName: string;
  recordingDuration?: number;
  navigationSteps: INavigationStepDto[];
  performTasksForm: {
    llmInstruction: string;
    shouldScrape: boolean;
    scrapeSelector?: string;
    returnHtmlForScrape: boolean;
    shouldTakeScreenshot: boolean;
    screenshotFullPage: boolean;
    screenshotSelector?: string;
    shouldRecordScreen: boolean;
    recordDuration?: number;
    recordOutputFileName?: string;
  };
}

const initialPlaywrightState: IPlaywrightState = {
  loading: false,
  error: null,
  results: null,
  currentUrl: '',
  activeRecording: false,
  recordingFileName: `recorded-${Date.now()}.webm`,
  recordingDuration: undefined,
  navigationSteps: [],
  performTasksForm: {
    shouldScrape: true,
    scrapeSelector: '',
    returnHtmlForScrape: false,
    shouldTakeScreenshot: true,
    screenshotFullPage: true,
    screenshotSelector: '',
    shouldRecordScreen: false,
    recordDuration: undefined,
    recordOutputFileName: `orchestrated-recording-${Date.now()}.webm`,
    llmInstruction: '',
  },
};

export const playwrightStore = atom<IPlaywrightState>(initialPlaywrightState);

export const setLoading = (isLoading: boolean) => {
  playwrightStore.set({ ...playwrightStore.get(), loading: isLoading });
};

export const setError = (error: string | null) => {
  playwrightStore.set({ ...playwrightStore.get(), error });
};

export const setResults = (results: IPlaywrightOutputDto | null) => {
  playwrightStore.set({ ...playwrightStore.get(), results, error: null });
};

export const setCurrentUrl = (url: string) => {
  playwrightStore.set({ ...playwrightStore.get(), currentUrl: url });
};

export const startRecording = (fileName: string, duration?: number) => {
  playwrightStore.set({
    ...playwrightStore.get(),
    activeRecording: true,
    recordingFileName: fileName,
    recordingDuration: duration,
  });
};

export const stopRecording = () => {
  playwrightStore.set({
    ...playwrightStore.get(),
    activeRecording: false,
    recordingFileName: `recorded-${Date.now()}.webm`, // Reset filename
    recordingDuration: undefined,
  });
};

export const addNavigationStep = (step: INavigationStepDto) => {
  playwrightStore.set({
    ...playwrightStore.get(),
    navigationSteps: [...playwrightStore.get().navigationSteps, step],
  });
};

export const updateNavigationStep = (index: number, updatedStep: INavigationStepDto) => {
  const currentSteps = [...playwrightStore.get().navigationSteps];
  currentSteps[index] = updatedStep;
  playwrightStore.set({ ...playwrightStore.get(), navigationSteps: currentSteps });
};

export const removeNavigationStep = (index: number) => {
  const currentSteps = [...playwrightStore.get().navigationSteps];
  currentSteps.splice(index, 1);
  playwrightStore.set({ ...playwrightStore.get(), navigationSteps: currentSteps });
};

export const clearNavigationSteps = () => {
  playwrightStore.set({ ...playwrightStore.get(), navigationSteps: [] });
};

export const updatePerformTasksForm = (updates: Partial<IPlaywrightState['performTasksForm']>) => {
  playwrightStore.set({
    ...playwrightStore.get(),
    performTasksForm: { ...playwrightStore.get().performTasksForm, ...updates },
  });
};

export const resetPlaywrightStore = () => {
  playwrightStore.set(initialPlaywrightState);
};
