import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class GitFileOperationDto {
  @ApiProperty({
    description: 'Path of the file to operate on (relative to projectRoot)',
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

export class GitFilesOperationDto {
  @ApiProperty({
    description: 'Array of file paths to operate on (relative to projectRoot)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  filePaths: string[];

  @ApiPropertyOptional({
    description: 'Optional project root path for the Git repository',
    example: '/path/to/my/repo',
  })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class GitResetStageDto {
  @ApiPropertyOptional({
    description:
      'Path of the file to unstage. If not provided, all staged changes are reset.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'Optional project root path for the Git repository',
    example: '/path/to/my/repo',
  })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
