import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';


export class GitStatusFileDto {
  @ApiProperty({ description: 'Path of the file' })
  @IsString()
  path: string;

  @ApiProperty({ description: 'Index status of the file' })
  @IsString()
  index: string;

  @ApiProperty({ description: 'Working directory status of the file' })
  @IsString()
  working_dir: string;
}

export class GitStatusRenamedDto {
  @ApiProperty({ description: 'Original path of the file' })
  @IsString()
  from: string;

  @ApiProperty({ description: 'New path of the file' })
  @IsString()
  to: string;
}

export class GitStatusResponseDto {
  @ApiPropertyOptional({ description: 'Current branch name', nullable: true })
  @IsOptional()
  @IsString()
  current: string | null;

  @ApiProperty({ description: 'True if HEAD is detached' })
  @IsBoolean()
  detached: boolean;

  @ApiProperty({ type: [GitStatusFileDto], description: 'List of files with their status' })
  @IsArray()
  files: GitStatusFileDto[];

  @ApiProperty({ type: [String], description: 'List of files not yet added to Git' })
  @IsArray()
  not_added: string[];

  @ApiProperty({ type: [String], description: 'List of conflicted files' })
  @IsArray()
  conflicted: string[];

  @ApiProperty({ type: [String], description: 'List of created files' })
  @IsArray()
  created: string[];

  @ApiProperty({ type: [String], description: 'List of deleted files' })
  @IsArray()
  deleted: string[];

  @ApiProperty({ type: [String], description: 'List of modified files' })
  @IsArray()
  modified: string[];

  @ApiProperty({ type: [GitStatusRenamedDto], description: 'List of renamed files' })
  @IsArray()
  renamed: GitStatusRenamedDto[];

  @ApiProperty({ type: [String], description: 'List of staged files' })
  @IsArray()
  staged: string[];

  @ApiProperty({ description: 'Number of commits ahead of tracking branch' })
  @IsNumber()
  ahead: number;

  @ApiProperty({ description: 'Number of commits behind tracking branch' })
  @IsNumber()
  behind: number;

  @ApiPropertyOptional({ description: 'Tracking branch name', nullable: true })
  @IsOptional()
  @IsString()
  tracking: string | null;

  @ApiProperty({ description: 'True if the working directory is clean' })
  @IsBoolean()
  is_clean: boolean;
}
