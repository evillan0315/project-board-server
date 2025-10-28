import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api/fetch';
import {
  GitBranchDto,
  GitCommitDto,
  GitStatusResponseDto,
  GitDiffDto,
  GitDiffResponseDto,
  GitResetHardDto,
  CommitDto,
  CreateBranchDto,
  CheckoutBranchDto,
  DeleteBranchDto,
  RevertCommitDto,
  GitFileOperationDto,
  GitFilesOperationDto,
  GitResetStageDto,
  CreateSnapshotDto,
  RestoreSnapshotDto,
  ListSnapshotsResponseDto
} from '~/git/dto';

/**
 * Fetches the current Git repository status.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns The current Git status.
 */
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

/**
 * Commits staged changes to the Git repository.
 * @param message - The commit message.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A response indicating the success of the commit.
 */
export const gitCommit = async (message: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Stages one or more files for the next commit.
 * @param filePaths - An array of file paths to stage.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating which files were staged.
 */
export const gitStageFiles = async (filePaths: string[], projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Unstages one or more files from the next commit.
 * @param filePaths - An array of file paths to unstage.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating which files were unstaged.
 */
export const gitUnstageFiles = async (filePaths: string[], projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Resets staged changes for a specific file or all staged changes.
 * @param filePath - Optional: The path of the file to unstage. If not provided, all staged changes are reset.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the reset operation.
 */
export const gitResetStagedChanges = async (filePath?: string, projectRoot?: string): Promise<{ message: string }> => {
  try {
    const dto: GitResetStageDto = { filePath, projectRoot };
    const response = await fetchWithAuth(`${API_BASE_URL}/git/reset-staged`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error resetting staged changes', error);
    throw error;
  }
};

/**
 * Performs a hard reset to a specific commit or HEAD.
 * WARNING: This discards all uncommitted changes.
 * @param dto - The GitResetHardDto containing commit hash and optional project root.
 * @returns A message indicating the success of the hard reset.
 */
export const gitResetHard = async (dto: GitResetHardDto): Promise<{ message: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/reset-hard`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error performing hard reset to ${dto.commitHash || 'HEAD'}`, error);
    throw error;
  }
};

/**
 * Fetches all local and remote branches for the repository.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns An array of Git branches.
 */
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

/**
 * Creates a new local branch and checks it out.
 * @param newBranchName - The name of the new branch.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the branch creation.
 */
export const gitCreateBranch = async (newBranchName: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Checks out an existing local or remote branch.
 * @param branchName - The name of the branch to checkout.
 * @param remote - Optional: Set to true to checkout a remote branch. Defaults to false.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the checkout operation.
 */
export const gitCheckoutBranch = async (branchName: string, remote: boolean = false, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Deletes a local branch.
 * @param branchName - The name of the branch to delete.
 * @param force - Optional: Set to true to force delete the branch (even if not merged). Defaults to false.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the branch deletion.
 */
export const gitDeleteBranch = async (branchName: string, force: boolean = false, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Reverts a specific commit or the last commit in the repository.
 * @param commitHash - The commit hash to revert, or 'HEAD' to revert the last commit.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the revert operation.
 */
export const gitRevertCommit = async (commitHash: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Discards changes in a specific file in the working directory.
 * @param filePath - The path of the file to undo changes for.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the undo operation.
 */
export const gitUndoFileChanges = async (filePath: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Creates a Git snapshot (tag current HEAD).
 * @param snapshotName - The name of the snapshot (tag) to create.
 * @param message - Optional: A message for the snapshot tag.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the snapshot creation.
 */
export const gitCreateSnapshot = async (snapshotName: string, message?: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Restores the repository to a specific snapshot (checks out the tag).
 * @param snapshotName - The name of the snapshot (tag) to restore.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the snapshot restoration.
 */
export const gitRestoreSnapshot = async (snapshotName: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Lists all available snapshots (Git tags) in the repository.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A list of snapshot names.
 */
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

/**
 * Deletes a specific snapshot (Git tag) from the repository.
 * @param snapshotName - The name of the snapshot (tag) to delete.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns A message indicating the success of the snapshot deletion.
 */
export const gitDeleteSnapshot = async (snapshotName: string, projectRoot?: string): Promise<{ message: string }> => {
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

/**
 * Retrieves the commit log for the repository.
 * @param projectRoot - Optional: The root path of the Git repository.
 * @returns An array of Git commits.
 */
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

/**
 * Retrieves the Git diff for a specific file.
 * @param filePath - The path of the file to get the diff for.
 * @param projectRoot - The root path of the Git repository.
 * @returns The raw Git diff output.
 */
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