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

  @ApiPropertyOptional({ description: 'The MIME type of the file.', example: 'video/mp4', nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string | null; // Changed to allow null

  @ApiPropertyOptional({
    description: 'The size of the file in bytes.',
    type: 'string',
    format: 'int64',
    example: '1024000',
  })
  @IsOptional()
  @IsString()
  size?: string; // This is fine as it's converted to string | undefined

  @ApiPropertyOptional({
    description: 'The provider from which the media was extracted (e.g., youtube).',
    example: 'youtube',
    nullable: true
  })
  @IsOptional()
  @IsString()
  provider?: string | null; // Changed to allow null

  @ApiPropertyOptional({ description: 'The original URL from which the media was extracted.', nullable: true })
  @IsOptional()
  @IsString()
  url?: string | null; // Changed to allow null

  @ApiProperty({ description: 'The timestamp when the file entry was created.' })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the file entry was last updated.', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date | null; // Changed to allow null

  @ApiProperty({ description: 'The ID of the user who created this file entry.' })
  @IsUUID()
  createdById: string;

  @ApiPropertyOptional({ description: 'The ID of the folder where the file is stored.', nullable: true })
  @IsOptional()
  @IsUUID()
  folderId?: string | null; // Changed to allow null
}

