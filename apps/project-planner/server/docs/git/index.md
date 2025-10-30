# Git Utility Module

The `git` module provides a comprehensive set of utilities for interacting with a local Git repository. It wraps the `simple-git` library and adds error handling and specific functionalities required by the Project Planner.

## Service

### `GitUtilService` (`src/git/git.util.ts`)
Provides an abstraction layer for performing common Git operations. All methods are designed to be robust, including error handling and context-awareness (e.g., checking if a directory is a Git repository).

**Key Responsibilities:**
-   Initialize `simple-git` instance with a specified project root.
-   Perform various Git commands: status, staging, committing, resetting, applying patches, branching, reverting, snapshotting.
-   Provide structured results for Git operations.
-   Ensure operations are performed within a valid Git repository.

**Key Methods:**
-   `getStatus(projectRoot?: string)`: Returns the current status of the Git repository, including staged, unstaged, and untracked files.
-   `stageFiles(filePaths: string[], projectRoot?: string)`: Stages specified files for the next commit.
-   `unstageFiles(filePaths: string[], projectRoot?: string)`: Unstages specified files.
-   `resetStagedChanges(projectRoot?: string)`: Unstages all currently staged changes.
-   `resetHard(commitHash?: string, projectRoot?: string)`: Performs a hard reset to a specific commit or HEAD, discarding local changes.
-   `commit(message: string, projectRoot?: string)`: Creates a new commit with staged changes.
-   `getHeadCommitHash(projectRoot?: string)`: Retrieves the hash of the current HEAD commit.
-   `applyPatch(patchContent: string, projectRoot?: string)`: Applies a given patch string to the repository. This is crucial for applying AI-generated diffs.
-   `getDiff(filePath: string, projectRoot?: string)`: Returns the Git diff for a specific file.
-   `createBranch(newBranchName: string, projectRoot?: string)`: Creates and checks out a new local branch.
-   `checkoutBranch(branchName: string, remote: boolean, projectRoot?: string)`: Checks out an existing local or remote tracking branch.
-   `revertCommit(commitHash: string, projectRoot?: string)`: Reverts a specific commit or the last commit.
-   `undoFileChanges(filePath: string, projectRoot?: string)`: Discards uncommitted changes in a specific file.
-   `createSnapshot(snapshotName: string, message?: string, projectRoot?: string)`: Creates a Git tag (snapshot) of the current state.
-   `restoreSnapshot(snapshotName: string, projectRoot?: string)`: Checks out a previously created snapshot (tag).
-   `listSnapshots(projectRoot?: string)`: Lists all available snapshots (tags).
-   `deleteSnapshot(snapshotName: string, projectRoot?: string)`: Deletes a specified snapshot (tag).
-   `getCommitLog(projectRoot?: string)`: Retrieves the commit history of the repository.

## Types (`src/git/types.ts`)

Defines interfaces for structured Git command outputs.

**Key Types:**
-   `StatusResultFile`, `RenamedFile`: Detailed information for files in `GitStatusResult`.
-   `GitStatusResult`: Comprehensive type representing the output of `git status`.
-   `GitBranch`: Information about a Git branch.
-   `GitCommit`: Information about a single Git commit in the log.