import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaFileResponseDto {
  @ApiProperty({ description: 'The unique identifier of the media file.' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'The name of the media file.' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The absolute path to the stored media file.' })
  @IsString()
  path: string;

  @ApiProperty({
    description: 'The type of the file (e.g., AUDIO, VIDEO, IMAGE, DOCUMENT, CODE, OTHER).',
    enum: FileType,
    example: FileType.VIDEO,
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiPropertyOptional({ description: 'The MIME type of the file.', example: 'video/mp4' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'The size of the file in bytes.',
    type: 'string',
    format: 'int64',
    example: '1024000',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'The provider from which the media was extracted (e.g., youtube).',
    example: 'youtube',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'The original URL from which the media was extracted.' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ description: 'The timestamp when the file entry was created.' })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the file entry was last updated.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ description: 'The ID of the user who created this file entry.' })
  @IsUUID()
  createdById: string;

  @ApiPropertyOptional({ description: 'The ID of the folder where the file is stored.' })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
