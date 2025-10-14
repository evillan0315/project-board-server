import { Controller, Get, Post, Body, Query, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GitService } from './git.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
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
  GitDiffDto, // Import the new DTO
  GitDiffResponseDto, // Import the new DTO
} from './dto';


@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Git Management')
@Controller('api/git')
@Roles(UserRole.ADMIN) // Restrict all Git operations to ADMIN users
export class GitController {
  constructor(private readonly gitService: GitService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current Git repository status' })
  @ApiResponse({ status: 200, type: GitStatusResponseDto })
  async getStatus(@Query('projectRoot') projectRoot?: string): Promise<GitStatusResponseDto> {
    return this.gitService.getStatus(projectRoot);
  }

  @Post('stage')
  @ApiOperation({ summary: 'Stage one or more files' })
  @ApiResponse({ status: 200, description: 'Files staged successfully' })
  async stageFiles(@Body() dto: GitFilesOperationDto): Promise<{ message: string }> {
    const message = await this.gitService.stageFiles(dto.filePaths, dto.projectRoot);
    return { message };
  }

  @Post('unstage')
  @ApiOperation({ summary: 'Unstage one or more files' })
  @ApiResponse({ status: 200, description: 'Files unstaged successfully' })
  async unstageFiles(@Body() dto: GitFilesOperationDto): Promise<{ message: string }> {
    const message = await this.gitService.unstageFiles(dto.filePaths, dto.projectRoot);
    return { message };
  }

  @Post('reset-staged')
  @ApiOperation({ summary: 'Reset all staged changes or a specific file' })
  @ApiResponse({ status: 200, description: 'Staged changes reset successfully' })
  async resetStagedChanges(@Body() dto: GitResetStageDto): Promise<{ message: string }> {
    if (dto.filePath) {
        const message = await this.gitService.unstageFiles([dto.filePath], dto.projectRoot);
        return { message };
    } else {
        const message = await this.gitService.resetStagedChanges(dto.projectRoot);
        return { message };
    }
  }

  @Post('commit')
  @ApiOperation({ summary: 'Commit staged changes' })
  @ApiResponse({ status: 200, type: CommitResponseDto })
  async commit(@Body() dto: CommitDto): Promise<CommitResponseDto> {
    const commitMessage = await this.gitService.commit(dto.message, dto.projectRoot);
    return { success: true, message: commitMessage };
  }

  @Post('revert')
  @ApiOperation({ summary: 'Revert a specific commit or the last commit' })
  @ApiResponse({ status: 200, description: 'Commit reverted successfully' })
  async revertCommit(@Body() dto: RevertCommitDto): Promise<{ message: string }> {
    const message = await this.gitService.revertCommit(dto.commitHash, dto.projectRoot);
    return { message };
  }

  @Post('undo-file-changes')
  @ApiOperation({ summary: 'Discard changes in a specific file in the working directory' })
  @ApiResponse({ status: 200, description: 'File changes undone successfully' })
  async undoFileChanges(@Body() dto: GitFileOperationDto): Promise<{ message: string }> {
    const message = await this.gitService.undoFileChanges(dto.filePath, dto.projectRoot);
    return { message };
  }

  @Get('branches')
  @ApiOperation({ summary: 'List all local and remote branches' })
  @ApiResponse({ status: 200, type: [GitBranchDto] })
  async getBranches(@Query('projectRoot') projectRoot?: string): Promise<GitBranchDto[]> {
    return this.gitService.getBranches(projectRoot);
  }

  @Post('branch')
  @ApiOperation({ summary: 'Create a new local branch and checkout' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async createBranch(@Body() dto: CreateBranchDto): Promise<{ message: string }> {
    const message = await this.gitService.createBranch(dto.newBranchName, dto.projectRoot);
    return { message };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout an existing local or remote branch' })
  @ApiResponse({ status: 200, description: 'Branch checked out successfully' })
  async checkoutBranch(@Body() dto: CheckoutBranchDto): Promise<{ message: string }> {
    const message = await this.gitService.checkoutBranch(dto.branchName, dto.remote || false, dto.projectRoot);
    return { message };
  }

  @Delete('branch')
  @ApiOperation({ summary: 'Delete a local branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  async deleteBranch(@Body() dto: DeleteBranchDto): Promise<{ message: string }> {
    const message = await this.gitService.deleteBranch(dto.branchName, dto.force || false, dto.projectRoot);
    return { message };
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Create a Git snapshot (tag current HEAD)' })
  @ApiResponse({ status: 201, description: 'Snapshot created successfully' })
  async createSnapshot(@Body() dto: CreateSnapshotDto): Promise<{ message: string }> {
    const message = await this.gitService.createSnapshot(dto.snapshotName, dto.message, dto.projectRoot);
    return { message };
  }

  @Post('restore-snapshot')
  @ApiOperation({ summary: 'Restore the repository to a specific snapshot (checkout tag)' })
  @ApiResponse({ status: 200, description: 'Snapshot restored successfully' })
  async restoreSnapshot(@Body() dto: RestoreSnapshotDto): Promise<{ message: string }> {
    const message = await this.gitService.restoreSnapshot(dto.snapshotName, dto.projectRoot);
    return { message };
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'List all available snapshots (Git tags)' })
  @ApiResponse({ status: 200, type: ListSnapshotsResponseDto })
  async listSnapshots(@Query('projectRoot') projectRoot?: string): Promise<ListSnapshotsResponseDto> {
    const tags = await this.gitService.listSnapshots(projectRoot);
    return { tags };
  }

  @Delete('snapshot/:snapshotName')
  @ApiOperation({ summary: 'Delete a specific snapshot (Git tag)' })
  @ApiResponse({ status: 200, description: 'Snapshot deleted successfully' })
  async deleteSnapshot(
    @Param('snapshotName') snapshotName: string,
    @Query('projectRoot') projectRoot?: string,
  ): Promise<{ message: string }> {
    const message = await this.gitService.deleteSnapshot(snapshotName, projectRoot);
    return { message };
  }

  @Get('commits')
  @ApiOperation({ summary: 'Get the commit log for the repository' })
  @ApiResponse({ status: 200, type: [GitCommitDto] })
  async getCommitLog(@Query('projectRoot') projectRoot?: string): Promise<GitCommitDto[]> {
    return this.gitService.getCommitLog(projectRoot);
  }

  @Post('diff')
  @ApiOperation({ summary: 'Get the Git diff for a specific file' })
  @ApiResponse({ status: 200, type: GitDiffResponseDto })
  async getDiff(@Body() dto: GitDiffDto): Promise<GitDiffResponseDto> {
    const diff = await this.gitService.getDiff(dto.filePath, dto.projectRoot);
    return { diff };
  }
}
