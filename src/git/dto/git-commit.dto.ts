import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CommitDto {
  @ApiProperty({ description: 'The commit message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class CommitResponseDto {
  @ApiProperty({ description: 'Indicates if the commit was successful' })
  success: boolean;

  @ApiProperty({ description: 'Message about the commit operation' })
  message: string;

  @ApiPropertyOptional({ description: 'Hash of the new commit' })
  commitHash?: string;
}

export class GitCommitDto {
  @ApiProperty({ description: 'The hash of the commit' })
  @IsString()
  hash: string;

  @ApiProperty({ description: 'The date of the commit' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'The commit message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'The author name of the commit' })
  @IsString()
  author_name: string;

  @ApiProperty({ description: 'The author email of the commit' })
  @IsString()
  author_email: string;
}

export class RevertCommitDto {
  @ApiProperty({ description: 'The commit hash to revert to, or "HEAD" to revert the last commit' })
  @IsString()
  @IsNotEmpty()
  commitHash: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
