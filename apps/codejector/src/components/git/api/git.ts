import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api/fetch';
import {
  GitBranchDto,
  GitCommitDto,
  GitStatusResponseDto,
  GitDiffResponseDto,
  GitResetHardDto,
  CommitDto,
  CreateBranchDto,
  CheckoutBranchDto,
  DeleteBranchDto,
  RevertCommitDto,
  GitFileOperationDto,
  GitFilesOperationDto,
  CreateSnapshotDto,
  RestoreSnapshotDto,
  ListSnapshotsResponseDto
} from '~/git/dto';
import { GitBranch, GitCommit, GitStatusResult } from '../types/git'; // Keep local types for components for now

export const getGitStatus = async (projectRoot?: string): Promise<GitStatusResponseDto> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/status?projectRoot=${projectRoot || ''}`, {
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
    const dto: CommitDto = { message, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/commit`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating commit', error);
    throw error;
  }
};

export const gitStageFiles = async (filePaths: string[], projectRoot?: string) => {
  try {
    const dto: GitFilesOperationDto = { filePaths, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/stage`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error staging files', error);
    throw error;
  }
};

export const gitUnstageFiles = async (filePaths: string[], projectRoot?: string) => {
  try {
    const dto: GitFilesOperationDto = { filePaths, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/unstage`, {
      method: 'POST',
      body: JSON.stringify(dto),
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

export const gitGetBranches = async (projectRoot?: string): Promise<GitBranchDto[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branches?projectRoot=${projectRoot || ''}`, {
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
    const dto: CreateBranchDto = { newBranchName, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating branch', error);
    throw error;
  }
};

export const gitCheckoutBranch = async (branchName: string, remote: boolean = false, projectRoot?: string) => {
  try {
    const dto: CheckoutBranchDto = { branchName, remote, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/checkout`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error checking out branch', error);
    throw error;
  }
};

export const gitDeleteBranch = async (branchName: string, force: boolean = false, projectRoot?: string) => {
  try {
    const dto: DeleteBranchDto = { branchName, force, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'DELETE',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting branch', error);
    throw error;
  }
};

export const gitRevertCommit = async (commitHash: string, projectRoot?: string) => {
  try {
    const dto: RevertCommitDto = { commitHash, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/revert`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error reverting commit', error);
    throw error;
  }
};

export const gitUndoFileChanges = async (filePath: string, projectRoot?: string) => {
  try {
    const dto: GitFileOperationDto = { filePath, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/undo-file-changes`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error undoing file changes', error);
    throw error;
  }
};

export const gitCreateSnapshot = async (snapshotName: string, message?: string, projectRoot?: string) => {
  try {
    const dto: CreateSnapshotDto = { snapshotName, message, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/snapshot`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating snapshot', error);
    throw error;
  }
};

export const gitRestoreSnapshot = async (snapshotName: string, projectRoot?: string) => {
  try {
    const dto: RestoreSnapshotDto = { snapshotName, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/restore-snapshot`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error restoring snapshot', error);
    throw error;
  }
};

export const gitListSnapshots = async (projectRoot?: string): Promise<ListSnapshotsResponseDto> => {
  try {

    const response = await fetchWithAuth(`${API_BASE_URL}/git/snapshots?projectRoot=${projectRoot || ''}`, {
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
    let url = `${API_BASE_URL}/git/snapshot/${snapshotName}`;
    if (projectRoot) {
      url += `?projectRoot=${projectRoot}`;
    }
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting snapshot', error);
    throw error;
  }
};

export const gitGetCommitLog = async (projectRoot?: string): Promise<GitCommitDto[]> => {
  try {

    const response = await fetchWithAuth(`${API_BASE_URL}/git/commits?projectRoot=${projectRoot || ''}`, {
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
    const dto: GitDiffDto = { filePath, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/diff`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    const data = await handleResponse<GitDiffResponseDto>(response);
    return data.diff;
  } catch (error) {
    console.error(`Error fetching git diff for ${filePath}:`, error);
    throw error;
  }
};
