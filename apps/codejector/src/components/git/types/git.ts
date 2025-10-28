/**
 * Git related types for the frontend application, mirroring backend DTOs for consistency.
 * These interfaces define the shape of data used within React components and Nanostores.
 */

// --- Git Status Types ---

/**
 * Represents a single file's status in the Git working directory.
 * Mirrors `GitStatusFileDto` from the backend.
 */
export interface IGitStatusFile {
  path: string;
  index: string; // E.g., 'M' for modified in index, '?' for untracked
  working_dir: string; // E.g., 'M' for modified in working directory, '?' for untracked
}

/**
 * Represents a renamed file in Git status.
 * Mirrors `GitStatusRenamedDto` from the backend.
 */
export interface IGitStatusRenamed {
  from: string;
  to: string;
}

/**
 * Represents the overall Git status of a repository.
 * Mirrors `GitStatusResponseDto` from the backend.
 */
export interface IGitStatusResult {
  current: string | null; // Current branch name
  detached: boolean; // True if HEAD is detached
  files: IGitStatusFile[]; // List of files with their status
  not_added: string[]; // List of files not yet added to Git (untracked)
  conflicted: string[]; // List of conflicted files
  created: string[]; // List of created files
  deleted: string[]; // List of deleted files
  modified: string[]; // List of modified files
  renamed: IGitStatusRenamed[]; // List of renamed files
  staged: string[]; // List of staged files
  ahead: number; // Number of commits ahead of tracking branch
  behind: number; // Number of commits behind tracking branch
  tracking: string | null; // Tracking branch name
  is_clean: boolean; // True if the working directory is clean
}

// --- Git Commit Types ---

/**
 * Represents a single Git commit.
 * Mirrors `GitCommitDto` from the backend.
 */
export interface IGitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

// --- Git Branch Types ---

/**
 * Represents a Git branch.
 * Mirrors `GitBranchDto` from the backend.
 */
export interface IGitBranch {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

// --- Utility/Request Specific Types ---

/**
 * Frontend-specific DTO for hard reset operations.
 * Mirrors `GitResetHardDto` from the backend, used for clarity in frontend context.
 */
export interface IGitResetHardDtoFrontend {
  commitHash?: string;
  projectRoot?: string;
}