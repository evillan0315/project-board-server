import { map } from 'nanostores';
import { IGitBranch, IGitCommit, IGitStatusResult } from '../types/git';

export interface GitState {
  status: IGitStatusResult | null;
  branches: IGitBranch[];
  commits: IGitCommit[];
  snapshots: string[];
  loading: boolean;
  error: string | null;
}

export const gitStore = map<GitState>({
  status: null,
  branches: [],
  commits: [],
  snapshots: [],
  loading: false,
  error: null,
});

/**
 * Set loading state for Gitloading
 */
export const setLoading = (isLoading: boolean) => {
  const state = gitStore.get();
  gitStore.set({ ...state, loading: isLoading });

  if (isLoading) {
    //addLog('Git State', 'Git state started...', 'info');
  } else {
    //addLog('Git State', 'Git state finished.', 'info');
  }
};
