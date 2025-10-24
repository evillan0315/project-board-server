import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GitResetHardDto {
  @ApiPropertyOptional({ description: 'The commit hash to reset to. If not provided, resets to HEAD.', nullable: true })
  @IsOptional()
  @IsString()
  commitHash?: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
