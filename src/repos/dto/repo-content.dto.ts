// src/repos/dto/repo-content.dto.ts
import { IsString, IsNumber, IsOptional, IsUrl, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RepoContentLinksDto {
  @ApiProperty({ description: 'Git API URL for the content' })
  @IsString()
  @IsUrl()
  git: string;

  @ApiProperty({ description: 'Self API URL for the content' })
  @IsString()
  @IsUrl()
  self: string;

  @ApiProperty({ description: 'HTML URL for the content on GitHub' })
  @IsString()
  @IsUrl()
  html: string;
}

export class RepoContentDto {
  @ApiProperty({ description: 'Name of the file or directory' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Path of the file or directory within the repository',
  })
  @IsString()
  path: string;

  @ApiProperty({ description: 'SHA hash of the content' })
  @IsString()
  sha: string;

  @ApiProperty({
    description: 'Type of the content',
    enum: ['file', 'dir', 'symlink', 'submodule'],
  })
  @IsIn(['file', 'dir', 'symlink', 'submodule'])
  type: 'file' | 'dir' | 'symlink' | 'submodule';

  @ApiProperty({ description: 'Size of the content in bytes (for files only)' })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'API URL to get the content details' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'HTML URL to view the content on GitHub' })
  @IsString()
  @IsUrl()
  html_url: string;

  @ApiProperty({ description: 'Git URL for the content' })
  @IsString()
  @IsUrl()
  git_url: string;

  @ApiPropertyOptional({
    description: 'Download URL for file content (only for files)',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  download_url?: string; // Only for files

  @ApiPropertyOptional({
    description:
      'Base64 encoded content of the file (only if fetching a single file and not directory listing)',
    type: String,
  })
  @IsOptional()
  @IsString()
  content?: string; // Base64 encoded, only if fetching a single file

  @ApiPropertyOptional({
    description: 'Encoding of the content (e.g., "base64")',
    type: String,
  })
  @IsOptional()
  @IsString()
  encoding?: string; // e.g., 'base64'

  @ApiProperty({
    type: RepoContentLinksDto,
    description: 'Links related to the content',
  })
  @Type(() => RepoContentLinksDto)
  _links: RepoContentLinksDto;
}
