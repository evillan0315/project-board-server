import {
  IsOptional,
  IsString,
  IsPositive,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FileType } from '@prisma/client';
import { MediaFileResponseDto } from './media-file-response.dto';

export class PaginationMediaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 1, description: 'Page number for pagination' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 10, description: 'Number of items per page' })
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by media file name (partial match).',
    example: 'my_video',
  })
  name?: string;

  @IsOptional()
  @IsEnum(FileType)
  @ApiPropertyOptional({
    description: 'Filter by media file type.',
    enum: FileType,
    example: FileType.VIDEO,
  })
  fileType?: FileType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by media provider (e.g., youtube).',
    example: 'youtube',
  })
  provider?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by original URL (partial match).',
    example: 'youtube.com',
  })
  url?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter by folder ID.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  folderId?: string;
}

export class PaginationMediaResultDto {
  @ApiProperty({
    type: [MediaFileResponseDto],
    description: 'List of media files for the current page.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaFileResponseDto)
  items: MediaFileResponseDto[];

  @ApiProperty({ description: 'Total number of media files matching the query.' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Current page number.' })
  @IsNumber()
  page: number;

  @ApiProperty({ description: 'Number of items per page.' })
  @IsNumber()
  pageSize: number;

  @ApiProperty({ description: 'Total number of available pages.' })
  @IsNumber()
  totalPages: number;
}
