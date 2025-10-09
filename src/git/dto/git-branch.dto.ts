import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, Matches } from 'class-validator';
import { GitBranch } from '../interfaces/git.interface';

export class GitBranchDto implements GitBranch {
  @ApiProperty({ description: 'Name of the branch' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'True if this is the current branch' })
  @IsBoolean()
  current: boolean;

  @ApiProperty({ description: 'Hash of the latest commit on this branch' })
  @IsString()
  commit: string;

  @ApiProperty({ description: 'Label for the branch (e.g., HEAD)' })
  @IsString()
  label: string;
}

export class CreateBranchDto {
  @ApiProperty({ description: 'Name of the new branch to create' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-]+$/, { message: 'Branch name must be alphanumeric, dashes, or underscores' })
  newBranchName: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class CheckoutBranchDto {
  @ApiProperty({ description: 'Name of the branch (local or remote) to checkout' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @ApiPropertyOptional({ description: 'Set to true to checkout a remote branch. Will create a local tracking branch if it doesn\'t exist.', default: false })
  @IsOptional()
  @IsBoolean()
  remote?: boolean = false;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class DeleteBranchDto {
  @ApiProperty({ description: 'Name of the branch to delete' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @ApiPropertyOptional({ description: 'Set to true to force delete the branch (even if not merged)', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
