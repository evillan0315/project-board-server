import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LlmPlaywrightService } from './llm-playwright.service';
import { ScrapeUrlDto, ScreenshotUrlDto, PlaywrightOutputDto } from './dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Restrict to ADMIN users
@ApiTags('LLM Playwright Operations')
@Controller('api/llm-playwright')
export class LlmPlaywrightController {
  constructor(private readonly llmPlaywrightService: LlmPlaywrightService) {}

  /**
   * Scrapes content from a specified URL using Playwright and optionally processes it with Gemini AI.
   */
  @Post('scrape')
  @ApiOperation({
    summary: 'Scrape content from a URL and optionally analyze with Gemini AI',
  })
  @ApiBody({ type: ScrapeUrlDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlaywrightOutputDto,
    description: 'Scraped content and optional Gemini analysis results.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid URL or selector.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to scrape or analyze.',
  })
  async scrapeUrl(
    @Body() scrapeUrlDto: ScrapeUrlDto,
  ): Promise<PlaywrightOutputDto> {
    return this.llmPlaywrightService.scrapeUrl(scrapeUrlDto);
  }

  /**
   * Takes a screenshot of a specified URL using Playwright and optionally processes it with Gemini AI.
   */
  @Post('screenshot')
  @ApiOperation({
    summary: 'Take a screenshot of a URL and optionally analyze with Gemini AI',
  })
  @ApiBody({ type: ScreenshotUrlDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlaywrightOutputDto,
    description:
      'Base64 encoded screenshot and optional Gemini analysis results.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid URL or selector.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to take screenshot or analyze.',
  })
  async takeScreenshot(
    @Body() screenshotUrlDto: ScreenshotUrlDto,
  ): Promise<PlaywrightOutputDto> {
    return this.llmPlaywrightService.takeScreenshot(screenshotUrlDto);
  }
}
