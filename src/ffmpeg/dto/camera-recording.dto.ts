import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class StartCameraRecordingDto {
  @ApiPropertyOptional({
    description: 'Identifier for the camera device to use (platform-specific).',
    example: ['default', '/dev/video0', 'Integrated Camera'],
    nullable: true,
  })
  @IsString()
  @IsOptional()
  cameraDevice?: string;

  @ApiPropertyOptional({
    description: 'Resolution for the camera recording, e.g., "1280x720".',
    example: '1280x720',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiPropertyOptional({
    description: 'Frames per second for the camera recording. Default: 30.',
    required: false,
    default: 30,
    minimum: 1,
    maximum: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  fps?: number;

  @ApiPropertyOptional({
    description: 'Duration of the recording in seconds. If not provided, records indefinitely until stopped. Max 2 hours.',
    required: false,
    default: 7200,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  duration?: number;
}

export class CameraRecordingResponseDto {
  @ApiProperty({ description: 'The ID of the recording entry in the database.' })
  id: string;

  @ApiProperty({ description: 'The full path to the recording file on the server.' })
  path: string;

  @ApiProperty({ description: 'A status message for the operation.' })
  message: string;
}
