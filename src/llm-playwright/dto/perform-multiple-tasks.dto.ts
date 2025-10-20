import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for performing multiple orchestrated Playwright tasks (scrape, screenshot) 
 * with an optional overarching LLM analysis.
 */
export class PerformMultipleTasksDto {
  @ApiProperty({
    description: 'The URL to navigate to and perform tasks on.',
    example: 'https://www.example.com',
  })
  @IsUrl()
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'A high-level instruction for the LLM to guide the overall task and analysis.',
    example: 'Summarize the main content of this page and identify any call-to-action buttons.',
  })
  @IsOptional()
  @IsString()
  llmInstruction?: string;

  @ApiPropertyOptional({
    description: 'Whether to perform a web scraping operation on the page. Defaults to true if no specific scrape/screenshot is requested.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  shouldScrape?: boolean;

  @ApiPropertyOptional({
    description: 'CSS selector to target specific content for scraping. If `shouldScrape` is true and this is not provided, the entire visible text content will be scraped.',
    example: '#main-content',
  })
  @IsOptional()
  @IsString()
  scrapeSelector?: string;

  @ApiPropertyOptional({
    description: 'Whether to return the full HTML of the scraped content instead of just text content. Only applicable if `shouldScrape` is true.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  returnHtmlForScrape?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to take a screenshot of the page. Defaults to true if no specific scrape/screenshot is requested.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  shouldTakeScreenshot?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to capture a full-page screenshot. Only applicable if `shouldTakeScreenshot` is true. Defaults to true.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  screenshotFullPage?: boolean;

  @ApiPropertyOptional({
    description: 'CSS selector for an element to screenshot. Only applicable if `shouldTakeScreenshot` is true. If provided, only this element will be screenshotted and overrides `screenshotFullPage`.',
    example: '.header-banner',
  })
  @IsOptional()
  @IsString()
  screenshotSelector?: string;
}