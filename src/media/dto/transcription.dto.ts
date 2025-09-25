import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TranscriptionSegmentDto {
  @ApiProperty({ description: 'Start time in seconds' })
  @IsNumber()
  start: number;

  @ApiProperty({ description: 'End time in seconds' })
  @IsNumber()
  end: number;

  @ApiProperty({ description: 'Transcribed text' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;
}

export class TranscriptionResultDto {
  @ApiProperty({
    type: [TranscriptionSegmentDto],
    description: 'Segments with timestamps',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptionSegmentDto)
  segments: TranscriptionSegmentDto[];

  @ApiProperty({ description: 'Full concatenated text' })
  @IsString()
  fullText: string;

  @ApiProperty({ description: 'Audio duration in seconds' })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Detected language', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Language detection probability',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  languageProbability?: number;
}

export class SyncTranscriptionRequestDto {
  @ApiProperty({ description: 'Current playback time in seconds' })
  @IsNumber()
  currentTime: number;
}

export class SyncTranscriptionResponseDto {
  @ApiProperty({
    type: TranscriptionSegmentDto,
    nullable: true,
    description: 'Current segment being played',
  })
  currentSegment: TranscriptionSegmentDto | null;

  @ApiProperty({
    type: [TranscriptionSegmentDto],
    description: 'Previous segments',
  })
  previousSegments: TranscriptionSegmentDto[];

  @ApiProperty({
    type: [TranscriptionSegmentDto],
    description: 'Upcoming segments',
  })
  upcomingSegments: TranscriptionSegmentDto[];

  @ApiProperty({
    type: TranscriptionResultDto,
    description: 'Full transcription',
  })
  fullTranscription: TranscriptionResultDto;
}
