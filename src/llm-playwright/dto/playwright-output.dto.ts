import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBase64,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { LlmOutputPlayDto } from './llm-output-play.dto'; // type-only import prevents runtime circular ref

export class PlaywrightOutputDto {
  @ApiPropertyOptional({
    description: 'The raw text content scraped from the page.',
  })
  @IsOptional()
  @IsString()
  scrapedText?: string;

  @ApiPropertyOptional({
    description: 'The raw HTML content scraped from the page.',
  })
  @IsOptional()
  @IsString()
  scrapedHtml?: string;

  @ApiPropertyOptional({
    description: 'Base64 encoded string of the screenshot image (PNG).',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAA...',
  })
  @IsOptional()
  @IsBase64()
  screenshotBase64?: string;

  @ApiPropertyOptional({
    description: 'The path to the recorded video file on the server, relative to the project root.',
    example: 'downloads/recordings/my-session-12345.webm',
  })
  @IsOptional()
  @IsString()
  recordedVideoPath?: string;

  @ApiPropertyOptional({
    description:
      'Results of the Gemini AI analysis on the scraped content or screenshot.',
    type: () => Object, // Avoid direct circular type reference for Swagger
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  geminiAnalysis?: LlmOutputPlayDto;

  @ApiProperty({ description: 'Indicates if the operation was successful.' })
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional({
    description: 'Error message if the operation failed.',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
