import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LlmPlaywrightService } from './llm-playwright.service';
import {
  ScrapeUrlDto,
  ScreenshotUrlDto,
  PlaywrightOutputDto,
  RecordScreenDto,
  PerformMultipleTasksDto,
} from './dto';
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

  /**
   * Starts recording the screen of a specified URL using Playwright.
   */
  @Post('start-recording')
  @ApiOperation({
    summary: 'Start screen recording of a URL',
    description:
      'Initiates a new Playwright screen recording session for the specified URL. The recording will continue indefinitely until `stop-recording` is explicitly called.',
  })
  @ApiBody({ type: RecordScreenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlaywrightOutputDto,
    description: 'Recording initiated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'A recording is already active, or invalid input.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to start recording.',
  })
  async startRecording(
    @Body() recordScreenDto: RecordScreenDto,
  ): Promise<PlaywrightOutputDto> {
    return this.llmPlaywrightService.startScreenRecording(recordScreenDto);
  }

  /**
   * Stops the active screen recording session.
   */
  @Post('stop-recording')
  @ApiOperation({
    summary: 'Stop active screen recording',
    description:
      'Stops the currently active Playwright screen recording session and returns the path to the saved video file.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlaywrightOutputDto,
    description: 'Recording stopped successfully, and video path returned.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No active recording session found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to stop recording or save video.',
  })
  async stopRecording(): Promise<PlaywrightOutputDto> {
    return this.llmPlaywrightService.stopScreenRecording();
  }

  /**
   * Performs multiple orchestrated Playwright tasks (scrape, screenshot) on a URL
   * and optionally analyzes the combined results with Gemini AI based on a high-level instruction.
   */
  @Post('perform-tasks')
  @ApiOperation({
    summary:
      'Perform multiple Playwright tasks and optionally analyze results with Gemini AI',
    description:
      'Navigates to a URL, performs specified scraping and/or screenshotting tasks, and then sends the collected data for an optional Gemini AI analysis based on the provided instruction. If screen recording is enabled, it will start at the beginning of the tasks and continue until all tasks are complete.',
  })
  @ApiBody({ type: PerformMultipleTasksDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlaywrightOutputDto,
    description:
      'Results from performed Playwright tasks and optional Gemini analysis.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid URL or task parameters.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to perform tasks or analyze.',
  })
  async performTasks(
    @Body() performMultipleTasksDto: PerformMultipleTasksDto,
  ): Promise<PlaywrightOutputDto> {
    return this.llmPlaywrightService.performMultipleTasks(
      performMultipleTasksDto,
    );
  }
}
