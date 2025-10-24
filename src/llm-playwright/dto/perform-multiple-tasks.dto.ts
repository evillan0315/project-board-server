import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NavigationStepDto } from './navigation-step.dto';

/**
 * DTO for performing multiple orchestrated Playwright tasks (
 * scrape, screenshot, navigation) with an optional overarching LLM analysis.
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
    description: 'A natural language instruction. This can either be a Playwright instruction (e.g., "Enter Email:x in (selector) and Password:y in (selector) and click button (selector)") which will be parsed into navigation steps, OR a high-level prompt for the LLM to guide the overall task analysis (e.g., "Summarize the key information on this page."). If it matches a known Playwright instruction pattern, it will be executed as such. Otherwise, it will be treated as a Gemini prompt for analysis.',
    example: 'Enter Email address:evillan0315@gmail.com in the (input#email) and Password:Chuk0y#031582 in the (input#password) field and click the Sign in (#login-submit-btn) button',
  })
  @IsOptional()
  @IsString()
  llmInstruction?: string;

  @ApiPropertyOptional({
    description: 'An ordered list of specific navigation steps (navigate, login, click, type) to perform before other tasks. Instructions from `llmInstruction` (if parsed as Playwright commands) will be prepended to this list.',
    type: [NavigationStepDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NavigationStepDto)
  navigationSteps?: NavigationStepDto[];

  @ApiPropertyOptional({
    description: 'Whether to perform a web scraping operation on the page. Defaults to true if no specific scrape/screenshot/recording is requested.',
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
    description: 'Whether to take a screenshot of the page. Defaults to true if no specific scrape/screenshot/recording is requested.',
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

  @ApiPropertyOptional({
    description: 'Whether to record the screen during the tasks. If true, recording starts at the beginning and stops automatically at the end of all tasks.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  shouldRecordScreen?: boolean;

  @ApiPropertyOptional({
    description: 'Optional desired file name for the output video (e.g., "my-task-recording.webm"). Only applicable if `shouldRecordScreen` is true. If not provided, a timestamp-based unique name will be used.',
    example: 'my-orchestrated-recording.webm',
  })
  @IsOptional()
  @IsString()
  recordOutputFileName?: string;
}
