import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for scraping a URL.
 */
export class ScrapeUrlDto {
  @ApiProperty({
    description: 'The URL to scrape.',
    example: 'https://www.example.com',
  })
  @IsUrl()
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description:
      'CSS selector to target specific content. If not provided, the entire visible text content will be scraped.',
    example: '#main-content h1',
  })
  @IsOptional()
  @IsString()
  selector?: string;

  @ApiPropertyOptional({
    description:
      'Whether to return the full HTML of the selected element(s) instead of just text content.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  returnHtml?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional prompt to send the scraped content to Gemini for analysis.',
    example: 'Summarize the key information on this page.',
  })
  @IsOptional()
  @IsString()
  geminiPrompt?: string;

  @ApiPropertyOptional({
    description:
      'Whether to take a screenshot along with scraping the page. The screenshot will be base64 encoded.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  takeScreenshot?: boolean;
}
