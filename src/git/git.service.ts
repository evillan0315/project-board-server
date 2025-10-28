import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as simpleGit from 'simple-git';
import * as path from 'path';

import {
  CommitDto,
  CommitResponseDto,
  CreateBranchDto,
  CheckoutBranchDto,
  DeleteBranchDto,
  RevertCommitDto,
  GitFileOperationDto,
  GitFilesOperationDto,
  GitResetStageDto,
  CreateSnapshotDto,
  RestoreSnapshotDto,
  ListSnapshotsResponseDto,
  DeleteSnapshotDto,
  GitBranchDto,
  GitCommitDto,
  GitStatusResponseDto,
  GitDiffDto,
  GitDiffResponseDto,
  GitResetHardDto,
} from '../git/dto'; // Updated import path

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly DEFAULT_PROJECT_ROOT: string;

  constructor(private readonly configService: ConfigService) {
    this.DEFAULT_PROJECT_ROOT =
      this.configService.get<string>('BASE_DIR') || process.cwd();
  }

  private getGit(projectRoot?: string): simpleGit.SimpleGit {
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!effectiveRoot) {
      throw new InternalServerErrorException(
        'Git project root is not defined.',
      );
    }
    return simpleGit.default(effectiveRoot);
  }

  private async isGitRepository(
    git: simpleGit.SimpleGit,
    projectRoot: string,
  ): Promise<boolean> {
    try {
      await git.revparse(['--is-inside-work-tree']);
      return true;
    } catch (error) {
      this.logger.warn(`Path ${projectRoot} is not a Git repository.`);
      return false;
    }
  }

  async getStatus(projectRoot?: string): Promise<GitStatusResponseDto> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const statusResult = await git.status();

      const responseDto: GitStatusResponseDto = {
        current: statusResult.current,
        detached: statusResult.detached,
        files: statusResult.files.map((file) => ({
          path: file.path,
          index: file.index,
          working_dir: file.working_dir,
        })),
        not_added: statusResult.not_added,
        conflicted: statusResult.conflicted,
        created: statusResult.created,
        deleted: statusResult.deleted,
        modified: statusResult.modified,
        renamed: statusResult.renamed.map((r) => ({
          from: r.from,
          to: r.to,
        })), // Map to GitStatusRenamedDto
        staged: statusResult.staged,
        ahead: statusResult.ahead,
        behind: statusResult.behind,
        tracking: statusResult.tracking,
        is_clean: statusResult.isClean(),
      };
      return responseDto;
    } catch (error) {
      this.logger.error(
        `Failed to get Git status: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get Git status: ${error.message}`,
      );
    }
  }

  async stageFiles(filePaths: string[], projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.add(filePaths);
      return `Staged files: ${filePaths.join(', ')}`;
    } catch (error) {
      this.logger.error(`Failed to stage files: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to stage files: ${error.message}`,
      );
    }
  }

  async unstageFiles(
    filePaths: string[],
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.reset(['--', ...filePaths]);
      return `Unstaged files: ${filePaths.join(', ')}`;
    } catch (error) {
      this.logger.error(
        `Failed to unstage files: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to unstage files: ${error.message}`,
      );
    }
  }

  async resetStagedChanges(projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.reset(); // Resets index to HEAD, unstaging all changes
      return 'All staged changes have been reset.';
    } catch (error) {
      this.logger.error(
        `Failed to reset staged changes: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to reset staged changes: ${error.message}`,
      );
    }
  }

  async resetHard(commitHash?: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      if (commitHash) {
        // Validate if the provided commitHash exists and is valid
        try {
          await git.show([commitHash]); // This will throw if commitHash is invalid
        } catch (validationError) {
          throw new BadRequestException(`Invalid commit hash: ${commitHash}`);
        }
        await git.reset(['--hard', commitHash]);
        return `Hard reset to commit ${commitHash} successful.`;
      } else {
        await git.reset(['--hard', 'HEAD']);
        return 'Hard reset to HEAD successful. All uncommitted changes discarded.';
      }
    } catch (error) {
      this.logger.error(
        `Failed to perform hard reset: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to perform hard reset: ${error.message}`,
      );
    }
  }

  async commit(message: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const commitSummary = await git.commit(message);
      return `Commit successful: ${commitSummary.commit}`;
    } catch (error) {
      this.logger.error(`Failed to commit: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to commit: ${error.message}`,
      );
    }
  }

  async getDiff(filePath: string, projectRoot?: string): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      // Get the diff for the specified file in the working directory against the index/HEAD.
      // 'full-path' ensures git treats the path relative to the root if not ambiguous.
      const diff = await git.diff(['--', filePath]);
      return diff;
    } catch (error) {
      this.logger.error(
        `Failed to get Git diff for file ${filePath}: ${error.stack}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get Git diff for file: ${error.message}`,
      );
    }
  }

  async getBranches(projectRoot?: string): Promise<GitBranchDto[]> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const branchSummary = await git.branch(['-v', '--all']);
      const branches: GitBranchDto[] = [];

      // Iterate over all branches (local and remote refs) found by simple-git
      for (const branchName of branchSummary.all) {
        if (branchSummary.branches[branchName]) {
          const branchData = branchSummary.branches[branchName];
          branches.push({
            name: branchName,
            current: branchData.current,
            commit: branchData.commit,
            label: branchData.label,
          });
        }
      }
      return branches;
    } catch (error) {
      this.logger.error(
        `Failed to get branches: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get branches: ${error.message}`,
      );
    }
  }

  async createBranch(
    newBranchName: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.checkoutLocalBranch(newBranchName);
      return `Branch \'${newBranchName}\' created and checked out.`;
    } catch (error) {
      this.logger.error(
        `Failed to create branch: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to create branch: ${error.message}`,
      );
    }
  }

  async checkoutBranch(
    branchName: string,
    remote: boolean,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      if (remote) {
        // Fetch remote branches first to ensure they are up-to-date
        await git.fetch();
        const remoteBranchRef = `remotes/origin/${branchName}`;
        const branchSummary = await git.branch(['-a']);

        if (
          !branchSummary.all.includes(remoteBranchRef) &&
          !branchSummary.all.includes(branchName)
        ) {
          throw new NotFoundException(
            `Remote branch 'origin/${branchName}' not found.`,
          );
        }

        // Check if local branch already exists
        if (branchSummary.branches[branchName]) {
          await git.checkout(branchName);
          return `Checked out existing local branch \'${branchName}\'`;
        } else {
          // Create and checkout new local branch tracking the remote one
          await git.checkout(['-b', branchName, remoteBranchRef]);
          return `Created and checked out local tracking branch \'${branchName}\' for 'origin/${branchName}'.`;
        }
      } else {
        const branchSummary = await git.branchLocal();
        if (!branchSummary.all.includes(branchName)) {
          throw new NotFoundException(
            `Local branch \'${branchName}\' not found.`,
          );
        }
        await git.checkout(branchName);
        return `Checked out local branch \'${branchName}\'`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to checkout branch: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to checkout branch: ${error.message}`,
      );
    }
  }

  async deleteBranch(
    branchName: string,
    force: boolean,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.deleteLocalBranch(branchName, force);
      return `Branch \'${branchName}\' deleted.`;
    } catch (error) {
      this.logger.error(
        `Failed to delete branch: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to delete branch: ${error.message}`,
      );
    }
  }

  async revertCommit(
    commitHash: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const log = await git.log({ maxCount: 1 });
      const latestCommit = log.latest?.hash;

      if (commitHash.toLowerCase() === 'head') {
        if (!latestCommit) {
          throw new NotFoundException('No commits found to revert.');
        }
        await git.revert(latestCommit);
        return `Successfully reverted the last commit (${latestCommit}).`;
      } else {
        // Validate if the provided commitHash exists and is valid
        try {
          await git.show([commitHash]); // This will throw if commitHash is invalid
        } catch (validationError) {
          throw new BadRequestException(`Invalid commit hash: ${commitHash}`);
        }
        await git.revert(commitHash);
        return `Successfully reverted commit ${commitHash}.`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to revert commit: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to revert commit: ${error.message}`,
      );
    }
  }

  async undoFileChanges(
    filePath: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      await git.checkout(['--', filePath]);
      return `Changes in \'${filePath}\' undone.`;
    } catch (error) {
      this.logger.error(
        `Failed to undo changes for file ${filePath}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to undo changes for file: ${error.message}`,
      );
    }
  }

  async createSnapshot(
    snapshotName: string,
    message?: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const tags = await git.tags();
      if (tags.all.includes(snapshotName)) {
        throw new BadRequestException(
          `Snapshot (tag) \'${snapshotName}\' already exists. Delete it first if you want to replace.`,
        );
      }
      await git.addAnnotatedTag(
        snapshotName,
        message || `Snapshot created on ${new Date().toISOString()}`,
      );
      return `Snapshot \'${snapshotName}\' created.`;
    } catch (error) {
      this.logger.error(
        `Failed to create snapshot: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create snapshot: ${error.message}`,
      );
    }
  }

  async restoreSnapshot(
    snapshotName: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const tags = await git.tags();
      if (!tags.all.includes(snapshotName)) {
        throw new NotFoundException(
          `Snapshot (tag) \'${snapshotName}\' not found.`,
        );
      }

      await git.checkout(snapshotName);
      return `Restored to snapshot \'${snapshotName}\' Repository is now in a detached HEAD state. Consider creating a new branch.`;
    } catch (error) {
      this.logger.error(
        `Failed to restore snapshot: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to restore snapshot: ${error.message}`,
      );
    }
  }

  async listSnapshots(projectRoot?: string): Promise<string[]> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const tags = await git.tags();
      return tags.all;
    } catch (error) {
      this.logger.error(
        `Failed to list snapshots: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to list snapshots: ${error.message}`,
      );
    }
  }

  async deleteSnapshot(
    snapshotName: string,
    projectRoot?: string,
  ): Promise<string> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
    }
    try {
      const tags = await git.tags();
      if (!tags.all.includes(snapshotName)) {
        throw new NotFoundException(
          `Snapshot (tag) \'${snapshotName}\' not found.`,
        );
      }
      await git.tag(['-d', snapshotName]);
      return `Snapshot \'${snapshotName}\' deleted successfully.`;
    } catch (error) {
      this.logger.error(
        `Failed to delete snapshot \'${snapshotName}\': ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete snapshot: ${error.message}`,
      );
    }
  }

  async getCommitLog(projectRoot?: string): Promise<GitCommitDto[]> {
    const git = this.getGit(projectRoot);
    const effectiveRoot = projectRoot
      ? path.resolve(projectRoot)
      : this.DEFAULT_PROJECT_ROOT;
    if (!(await this.isGitRepository(git, effectiveRoot))) {
      throw new BadRequestException(
        `Directory \'${effectiveRoot}\' is not a Git repository.`,
      );
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
    } catch (error) {
      this.logger.error(
        `Failed to get commit log: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get commit log: ${error.message}`,
      );
    }
  }
}
