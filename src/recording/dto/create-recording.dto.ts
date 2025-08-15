import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsDateString,
  IsPositive,
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
