import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsDateString,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRecordingDto {
  @ApiProperty({ description: 'Path to the recording file' })
  @IsString()
  path: string;

  @ApiProperty({ description: 'Type of the recording (e.g., audio, video)' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Process ID related to this recording' })
  @IsString()
  pid: string;

  @ApiProperty({ description: 'Current status of the recording' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Structured recording data' })
  @IsObject()
  data: any;

  @ApiProperty({ description: 'ID of the user who created the recording' })
  @IsUUID()
  createdById: string;
}

export class StartRecordingDto {
  @ApiPropertyOptional({ description: 'Recording name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Whether to enable audio recording during screen capture. Defaults to false.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAudio?: boolean;

  @ApiPropertyOptional({
    description:
      'Specific audio input device to use (e.g., "default", "alsa_input.pci-...", "0" on macOS). Requires enableAudio to be true.',
    example: 'default',
  })
  @IsOptional()
  @IsString()
  audioDevice?: string;
}

export class ScreenshotDto {
  @ApiPropertyOptional({
    description: 'Output format for the screenshot. Defaults to jpeg.',
    enum: ['jpeg', 'png', 'webp'],
    example: 'jpeg',
  })
  @IsOptional()
  @IsString()
  format?: 'jpeg' | 'png' | 'webp';

  @ApiPropertyOptional({
    description: 'Quality for JPEG/WebP output (1-100). Defaults to 90.',
    minimum: 1,
    maximum: 100,
    example: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  quality?: number;
}

export class ScreenshotResponseDto {
  @ApiProperty({
    description: 'The ID of the recording entry in the database.',
  })
  id: string;

  @ApiProperty({
    description: 'The full path to the captured screenshot file on the server.',
  })
  path: string;

  @ApiProperty({ description: 'A status message for the operation.' })
  message: string;
}

export class RecordingResultDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  path: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  pid: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsObject()
  data: any;

  @ApiProperty()
  @IsDateString()
  createdAt: string;

  @ApiProperty()
  @IsUUID()
  createdById: string;
}

export class PaginationRecordingResultDto {
  @ApiProperty({ type: [RecordingResultDto] })
  items: RecordingResultDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationRecordingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 1, description: 'Page number (starts at 1)' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 10, description: 'Number of items per page' })
  pageSize: number = 10;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Optional filter by status' })
  @IsString()
  status?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Optional filter by process ID' })
  @IsString()
  pid?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Optional filter by type (e.g., audio, video)',
  })
  @IsString()
  type?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Optional filter by createdById' })
  @IsUUID()
  createdById?: string;
}
