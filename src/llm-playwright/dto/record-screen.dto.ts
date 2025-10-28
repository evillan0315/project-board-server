import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

/**
 * DTO for initiating a screen recording session.
 * The recording will continue until `stop-recording` is explicitly called.
 */
export class RecordScreenDto {
  @ApiProperty({
    description: 'The URL to navigate to and start recording from.',
    example: 'https://www.google.com',
  })
  @IsUrl()
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description:
      'Optional desired file name for the output video (e.g., "my-session-recording.webm"). If not provided, a timestamp-based unique name will be used.',
    example: 'my-custom-recording.webm',
  })
  @IsOptional()
  @IsString()
  outputFileName?: string;
}
