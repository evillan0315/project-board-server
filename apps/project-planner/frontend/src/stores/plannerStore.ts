import { atom } from 'nanostores';
import { IPlan } from '@/types/planner';

interface PlannerState {
  currentPlan: IPlan | null;
  isLoading: boolean;
  error: string | null;
}

export const plannerStore = atom<PlannerState>({
  currentPlan: null,
  isLoading: false,
  error: null,
});

export const setCurrentPlan = (plan: IPlan | null) => {
  plannerStore.set({ ...plannerStore.get(), currentPlan: plan });
};

export const setIsLoading = (loading: boolean) => {
  plannerStore.set({ ...plannerStore.get(), isLoading: loading });
};

export const setError = (error: string | null) => {
  plannerStore.set({ ...plannerStore.get(), error: error });
};
