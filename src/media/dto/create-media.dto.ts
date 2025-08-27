import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const allowedMediaFormats = ['mp3', 'webm', 'm4a', 'wav', 'mp4', 'flv'] as const;
type AllowedMediaFormat = (typeof allowedMediaFormats)[number];

export class CreateMediaDto {
  @ApiProperty({
    description: 'The URL of the audio/video to extract.',
    example: 'https://www.youtube.com/watch?v=xyz',
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: "The desired format for the extracted media. Defaults to 'webm'.",
    enum: allowedMediaFormats,
    example: 'mp4',
    default: 'webm',
  })
  @IsOptional()
  @IsString()
  @IsIn(allowedMediaFormats)
  format?: AllowedMediaFormat = 'webm';

  @ApiPropertyOptional({
    description: 'The source provider (e.g., youtube, vimeo, udemy).',
    example: 'youtube',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description:
      'Whether to include authentication cookies for private content. Defaults to false.',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  cookieAccess?: boolean = false;
}
