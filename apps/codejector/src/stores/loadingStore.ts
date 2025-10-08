// Source: src/stores/loadingStore.ts
import { atom } from 'nanostores';

interface LoadingState {
  [key: string]: boolean;
}

/**
 * Global loading state store.
 * Each key represents a specific request identifier,
 * e.g. "recordings.fetch" or "recordings.delete".
 */
export const loadingStore = atom<LoadingState>({});

/**
 * Utility functions to set or clear loading state for a given key.
 */
export function setLoading(key: string, isLoading: boolean) {
  loadingStore.set({
    ...loadingStore.get(),
    [key]: isLoading,
  });
}

export function isLoading(key: string): boolean {
  return Boolean(loadingStore.get()[key]);
}
