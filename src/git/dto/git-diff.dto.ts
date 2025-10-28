import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GitDiffDto {
  @ApiProperty({
    description:
      'Path of the file for which to retrieve the diff (relative to projectRoot)',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiPropertyOptional({
    description: 'Optional project root path for the Git repository',
    example: '/path/to/my/repo',
  })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class GitDiffResponseDto {
  @ApiProperty({
    description: 'The raw Git diff output for the specified file',
  })
  @IsString()
  diff: string;
}
