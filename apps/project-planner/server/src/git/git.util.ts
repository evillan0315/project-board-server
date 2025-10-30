import * as simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs/promises'; // Use promise-based fs
import { promisify } from 'util';
import { exec as _exec } from 'child_process';
import { GitBranch, GitCommit, GitStatusResult, RenamedFile, StatusResultFile } from './types';
import { CustomError } from '../common/errors';

const exec = promisify(_exec);

export class GitUtilService {
  private readonly DEFAULT_PROJECT_ROOT: string;

  constructor(baseDir?: string) {
    this.DEFAULT_PROJECT_ROOT = baseDir || process.cwd();
  }

  private getGit(projectRoot?: string): simpleGit.SimpleGit {
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!effectiveRoot) {
      throw new CustomError('Git project root is not defined.', 500);
    }
    return simpleGit.default(effectiveRoot);
  }

  private async isGitRepository(git: simpleGit.SimpleGit, projectRoot: string): Promise<boolean> {
    try {
      await git.revparse(['--is-inside-work-tree']);
      return true;
    } catch (error) {
      console.warn(`Path ${projectRoot} is not a Git repository: ${error.message}`);
      return false;
    }
  }

  async getStatus(projectRoot?: string): Promise<GitStatusResult> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const statusResult = await git.status();

      const files: StatusResultFile[] = statusResult.files.map((file) => ({
        path: file.path,
        index: file.index,
        working_dir: file.working_dir,
      }));

      const renamed: RenamedFile[] = statusResult.renamed.map((r) => ({
        from: r.from,
        to: r.to,
      }));

      return {
        current: statusResult.current,
        detached: statusResult.detached,
        files,
        not_added: statusResult.not_added,
        conflicted: statusResult.conflicted,
        created: statusResult.created,
        deleted: statusResult.deleted,
        modified: statusResult.modified,
        renamed,
        staged: statusResult.staged,
        ahead: statusResult.ahead,
        behind: statusResult.behind,
        tracking: statusResult.tracking,
        is_clean: statusResult.isClean(),
      };
    } catch (error: any) {
      console.error(`Failed to get Git status: ${error.message}`, error.stack);
      throw new CustomError(`Failed to get Git status: ${error.message}`, 500);
    }
  }

  async stageFiles(filePaths: string[], projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      await git.add(filePaths);
      return `Staged files: ${filePaths.join(', ')}`;
    } catch (error: any) {
      console.error(`Failed to stage files: ${error.message}`, error.stack);
      throw new CustomError(`Failed to stage files: ${error.message}`, 500);
    }
  }

  async unstageFiles(filePaths: string[], projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      await git.reset(['--', ...filePaths]);
      return `Unstaged files: ${filePaths.join(', ')}`;
    } catch (error: any) {
      console.error(`Failed to unstage files: ${error.message}`, error.stack);
      throw new CustomError(`Failed to unstage files: ${error.message}`, 500);
    }
  }

  async resetStagedChanges(projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      await git.reset(); // Resets index to HEAD, unstaging all changes
      return 'All staged changes have been reset.';
    } catch (error: any) {
      console.error(`Failed to reset staged changes: ${error.message}`, error.stack);
      throw new CustomError(`Failed to reset staged changes: ${error.message}`, 500);
    }
  }

  async resetHard(commitHash?: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      if (commitHash) {
        try {
          await git.show([commitHash]);
        } catch (validationError: any) {
          throw new CustomError(`Invalid commit hash: ${commitHash}`, 400);
        }
        await git.reset(['--hard', commitHash]);
        return `Hard reset to commit ${commitHash} successful.`;
      } else {
        await git.reset(['--hard', 'HEAD']);
        return 'Hard reset to HEAD successful. All uncommitted changes discarded.';
      }
    } catch (error: any) {
      console.error(`Failed to perform hard reset: ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to perform hard reset: ${error.message}`, 500);
    }
  }

  async commit(message: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const commitSummary = await git.commit(message);
      return `Commit successful: ${commitSummary.commit}`;
    } catch (error: any) {
      console.error(`Failed to commit: ${error.message}`, error.stack);
      throw new CustomError(`Failed to commit: ${error.message}`, 500);
    }
  }

  async getHeadCommitHash(projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      return (await git.revparse(['HEAD'])).trim();
    } catch (error: any) {
      console.error(`Failed to get HEAD commit hash: ${error.message}`, error.stack);
      throw new CustomError(`Failed to get HEAD commit hash: ${error.message}`, 500);
    }
  }

  async applyPatch(patchContent: string, projectRoot?: string): Promise<string> {
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;

    if (!(await this.isGitRepository(this.getGit(effectiveRoot), effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }

    try {
      const tempPatchPath = path.join(effectiveRoot, `.temp-ai-patch-${Date.now()}.patch`);
      await fs.writeFile(tempPatchPath, patchContent, 'utf-8');

      const { stdout, stderr } = await exec(`git apply ${tempPatchPath}`, { cwd: effectiveRoot });

      await fs.unlink(tempPatchPath).catch(e => console.warn(`Failed to delete temp patch file: ${e.message}`));

      if (stderr) {
        console.warn(`git apply stderr: ${stderr}`);
      }
      return `Patch applied successfully: ${stdout}`;
    } catch (error: any) {
      console.error(`Failed to apply patch: ${error.message}`, error.stack);
      throw new CustomError(`Failed to apply patch: ${error.message}`, 500);
    }
  }

  async getDiff(filePath: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const diff = await git.diff(['--', filePath]);
      return diff;
    } catch (error: any) {
      console.error(`Failed to get Git diff for file ${filePath}: ${error.stack}`, error.stack);
      throw new CustomError(`Failed to get Git diff for file: ${error.message}`, 500);
    }
  }

  async createBranch(newBranchName: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      await git.checkoutLocalBranch(newBranchName);
      return `Branch '${newBranchName}' created and checked out.`;
    } catch (error: any) {
      console.error(`Failed to create branch: ${error.message}`, error.stack);
      throw new CustomError(`Failed to create branch: ${error.message}`, 500);
    }
  }

  async checkoutBranch(branchName: string, remote: boolean, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      if (remote) {
        await git.fetch();
        const remoteBranchRef = `remotes/origin/${branchName}`;
        const branchSummary = await git.branch(['-a']);

        if (
          !branchSummary.all.includes(remoteBranchRef) &&
          !branchSummary.all.includes(branchName)
        ) {
          throw new CustomError(`Remote branch 'origin/${branchName}' not found.`, 404);
        }

        if (branchSummary.branches[branchName]) {
          await git.checkout(branchName);
          return `Checked out existing local branch '${branchName}'`;
        } else {
          await git.checkout(['-b', branchName, remoteBranchRef]);
          return `Created and checked out local tracking branch '${branchName}' for 'origin/${branchName}'.`;
        }
      } else {
        const branchSummary = await git.branchLocal();
        if (!branchSummary.all.includes(branchName)) {
          throw new CustomError(`Local branch '${branchName}' not found.`, 404);
        }
        await git.checkout(branchName);
        return `Checked out local branch '${branchName}'`;
      }
    } catch (error: any) {
      console.error(`Failed to checkout branch: ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to checkout branch: ${error.message}`, 500);
    }
  }

  async revertCommit(commitHash: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const log = await git.log({ maxCount: 1 });
      const latestCommit = log.latest?.hash;

      if (commitHash.toLowerCase() === 'head') {
        if (!latestCommit) {
          throw new CustomError('No commits found to revert.', 404);
        }
        await git.revert(latestCommit);
        return `Successfully reverted the last commit (${latestCommit}).`;
      } else {
        try {
          await git.show([commitHash]);
        } catch (validationError: any) {
          throw new CustomError(`Invalid commit hash: ${commitHash}`, 400);
        }
        await git.revert(commitHash);
        return `Successfully reverted commit ${commitHash}.`;
      }
    } catch (error: any) {
      console.error(`Failed to revert commit: ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to revert commit: ${error.message}`, 500);
    }
  }

  async undoFileChanges(filePath: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      await git.checkout(['--', filePath]);
      return `Changes in '${filePath}' undone.`;
    } catch (error: any) {
      console.error(`Failed to undo changes for file ${filePath}: ${error.message}`, error.stack);
      throw new CustomError(`Failed to undo changes for file: ${error.message}`, 500);
    }
  }

  async createSnapshot(snapshotName: string, message?: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const tags = await git.tags();
      if (tags.all.includes(snapshotName)) {
        throw new CustomError(
          `Snapshot (tag) '${snapshotName}' already exists. Delete it first if you want to replace.`,
          400,
        );
      }
      await git.addAnnotatedTag(
        snapshotName,
        message || `Snapshot created on ${new Date().toISOString()}`,
      );
      return `Snapshot '${snapshotName}' created.`;
    } catch (error: any) {
      console.error(`Failed to create snapshot: ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to create snapshot: ${error.message}`, 500);
    }
  }

  async restoreSnapshot(snapshotName: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const tags = await git.tags();
      if (!tags.all.includes(snapshotName)) {
        throw new CustomError(`Snapshot (tag) '${snapshotName}' not found.`, 404);
      }

      await git.checkout(snapshotName);
      return `Restored to snapshot '${snapshotName}'. Repository is now in a detached HEAD state. Consider creating a new branch.`;
    } catch (error: any) {
      console.error(`Failed to restore snapshot: ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to restore snapshot: ${error.message}`, 500);
    }
  }

  async listSnapshots(projectRoot?: string): Promise<string[]> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const tags = await git.tags();
      return tags.all;
    } catch (error: any) {
      console.error(`Failed to list snapshots: ${error.message}`, error.stack);
      throw new CustomError(`Failed to list snapshots: ${error.message}`, 500);
    }
  }

  async deleteSnapshot(snapshotName: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const tags = await git.tags();
      if (!tags.all.includes(snapshotName)) {
        throw new CustomError(`Snapshot (tag) '${snapshotName}' not found.`, 404);
      }
      await git.tag(['-d', snapshotName]);
      return `Snapshot '${snapshotName}' deleted successfully.`;
    } catch (error: any) {
      console.error(`Failed to delete snapshot '${snapshotName}': ${error.message}`, error.stack);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to delete snapshot: ${error.message}`, 500);
    }
  }

  async getCommitLog(projectRoot?: string): Promise<GitCommit[]> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot ? path.resolve(projectRoot) : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new CustomError(`Directory '${effectiveRoot}' is not a Git repository.`, 400);
    }
    try {
      const log = await git.log();
      return log.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
      }));
    } catch (error: any) {
      console.error(`Failed to get commit log: ${error.message}`, error.stack);
      throw new CustomError(`Failed to get commit log: ${error.message}`, 500);
    }
  }
}
