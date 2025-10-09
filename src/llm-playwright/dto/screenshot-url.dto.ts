import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for taking a screenshot of a URL.
 */
export class ScreenshotUrlDto {
  @ApiProperty({
    description: 'The URL to take a screenshot of.',
    example: 'https://www.google.com',
  })
  @IsUrl()
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Whether to capture a full-page screenshot. Defaults to true.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  fullPage?: boolean;

  @ApiPropertyOptional({
    description:
      'CSS selector for an element to screenshot. If provided, only this element will be screenshotted. Overrides `fullPage` if present.',
    example: '.my-component',
  })
  @IsOptional()
  @IsString()
  selector?: string;

  @ApiPropertyOptional({
    description:
      'Optional prompt to send the screenshot image to Gemini for analysis.',
    example: 'Describe what you see in this image.',
  })
  @IsOptional()
  @IsString()
  geminiPrompt?: string;
}
