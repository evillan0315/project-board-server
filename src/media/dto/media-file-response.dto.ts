import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '@prisma/client';

export class MediaFileResponseDto {
  @ApiProperty({ description: 'The unique identifier of the media file.' })
  id: string;

  @ApiProperty({ description: 'The name of the media file.' })
  name: string;

  @ApiProperty({ description: 'The absolute path to the stored media file.' })
  path: string;

  @ApiProperty({
    description: 'The type of the file (e.g., AUDIO, VIDEO, IMAGE, DOCUMENT, CODE, OTHER).',
    enum: FileType,
    example: FileType.VIDEO,
  })
  fileType: FileType;

  @ApiPropertyOptional({ description: 'The MIME type of the file.', example: 'video/mp4' })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'The size of the file in bytes.',
    type: 'string',
    format: 'int64',
    example: '1024000',
  })
  size?: string;

  @ApiPropertyOptional({
    description: 'The provider from which the media was extracted (e.g., youtube).',
    example: 'youtube',
  })
  provider?: string;

  @ApiPropertyOptional({ description: 'The original URL from which the media was extracted.' })
  url?: string;

  @ApiProperty({ description: 'The timestamp when the file entry was created.' })
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the file entry was last updated.' })
  updatedAt: Date;

  @ApiProperty({ description: 'The ID of the user who created this file entry.' })
  createdById: string;

  @ApiPropertyOptional({ description: 'The ID of the folder where the file is stored.' })
  folderId?: string;
}
