import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import { GitBranch, GitStatusResult, GitCommit, GitDiffResponseDto, GitResetHardDto } from '@/types/git';

export const getGitStatus = async (projectRoot?: string): Promise<GitStatusResult> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/status?projectRoot=${projectRoot}`, {
      method: 'GET'
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching git status:', error);
    throw error;
  }
};

export const gitCommit = async (message: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating commit', error);
    throw error;
  }
};

export const gitStageFiles = async (filePaths: string[], projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/stage`, {
      method: 'POST',
      body: JSON.stringify({ filePaths, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error staging files', error);
    throw error;
  }
};

export const gitUnstageFiles = async (filePaths: string[], projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/unstage`, {
      method: 'POST',
      body: JSON.stringify({ filePaths, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error unstaging files', error);
    throw error;
  }
};

export const gitResetStagedChanges = async (filePath?: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/reset-staged`, {
      method: 'POST',
      body: JSON.stringify({ filePath, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error resetting staged changes', error);
    throw error;
  }
};

export const gitResetHard = async (dto: GitResetHardDto) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/reset-hard`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error performing hard reset to ${dto.commitHash}`, error);
    throw error;
  }
};

export const gitGetBranches = async (projectRoot?: string): Promise<GitBranch[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branches?projectRoot=${projectRoot}`, {
      method: 'GET'
    });
    return await handleResponse(response);
 
  } catch (error) {
    console.error('Error fetching branches', error);
    throw error;
  }
};

export const gitCreateBranch = async (newBranchName: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'POST',
      body: JSON.stringify({ newBranchName, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating branch', error);
    throw error;
  }
};

export const gitCheckoutBranch = async (branchName: string, remote: boolean = false, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/checkout`, {
      method: 'POST',
      body: JSON.stringify({ branchName, remote, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error checking out branch', error);
    throw error;
  }
};

export const gitDeleteBranch = async (branchName: string, force: boolean = false, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'DELETE',
      body: JSON.stringify({ branchName, force, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting branch', error);
    throw error;
  }
};

export const gitRevertCommit = async (commitHash: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/revert`, {
      method: 'POST',
      body: JSON.stringify({ commitHash, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error reverting commit', error);
    throw error;
  }
};

export const gitUndoFileChanges = async (filePath: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/undo-file-changes`, {
      method: 'POST',
      body: JSON.stringify({ filePath, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error undoing file changes', error);
    throw error;
  }
};

export const gitCreateSnapshot = async (snapshotName: string, message?: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/snapshot`, {
      method: 'POST',
      body: JSON.stringify({ snapshotName, message, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating snapshot', error);
    throw error;
  }
};

export const gitRestoreSnapshot = async (snapshotName: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/restore-snapshot`, {
      method: 'POST',
      body: JSON.stringify({ snapshotName, projectRoot }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error restoring snapshot', error);
    throw error;
  }
};

export const gitListSnapshots = async (projectRoot?: string): Promise<{ tags: string[] }> => {
  try {

    const response = await fetchWithAuth(`${API_BASE_URL}/git/snapshots?projectRoot=${projectRoot}`, {
      method: 'GET',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error listing snapshots', error);
    throw error;
  }
};

export const gitDeleteSnapshot = async (snapshotName: string, projectRoot?: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/snapshot/${snapshotName}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting snapshot', error);
    throw error;
  }
};

export const gitGetCommitLog = async (projectRoot?: string): Promise<GitCommit[]> => {
  try {

    const response = await fetchWithAuth(`${API_BASE_URL}/git/commits?projectRoot=${projectRoot}`, {
      method: 'GET',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching commit log:', error);
    throw error;
  }
};

export const getGitDiff = async (
  filePath: string,
  projectRoot: string,
): Promise<string> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/diff`, {
      method: 'POST',
      body: JSON.stringify({ filePath, projectRoot }),
    });
    const data = await handleResponse<GitDiffResponseDto>(response);
    return data.diff;
  } catch (error) {
    console.error(`Error fetching git diff for ${filePath}:`, error);
    throw error;
  }
};
