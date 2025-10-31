import { atom } from 'nanostores';
import type { Plan } from '../types';

interface PlannerState {
  userPrompt: string;
  currentPlanId: string | null;
  plan: Plan | null;
  isLoading: boolean;
  error: string | null;
  applyStatus: 'idle' | 'applying' | 'success' | 'failure';
  applyError: string | null;
}

export const plannerStore = atom<PlannerState>({
  userPrompt: '',
  currentPlanId: null,
  plan: null,
  isLoading: false,
  error: null,
  applyStatus: 'idle',
  applyError: null,
});

export const setUserPrompt = (prompt: string) => {
  plannerStore.set({ ...plannerStore.get(), userPrompt: prompt });
};

export const setPlan = (planId: string | null, plan: Plan | null) => {
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

export const resetPlannerState = () => {
  plannerStore.set({
    userPrompt: '',
    currentPlanId: null,
    plan: null,
    isLoading: false,
    error: null,
    applyStatus: 'idle',
    applyError: null,
  });
};
