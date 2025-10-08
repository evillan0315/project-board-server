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
