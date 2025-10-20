import { Injectable, Logger, InternalServerErrorException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, firefox, webkit, Browser, Page, BrowserContext, Video } from 'playwright'; // Import BrowserContext and Video
import { ScrapeUrlDto, ScreenshotUrlDto, PlaywrightOutputDto, RecordScreenDto } from './dto'; // Import RecordScreenDto
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { GoogleGeminiImageService } from '../google/google-gemini/google-gemini-image.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { ImageCaptionDto } from '../google/google-gemini/dto/image-caption.dto';
import { RequestType } from '@prisma/client';
import { promises as fs } from 'fs'; // Import fs.promises for file operations
import * as path from 'path'; // Import path module
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames

interface ActiveRecordingSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  video: Video; // Playwright's Video object
  outputPathPromise: Promise<string>; // Promise that resolves to the final video path
  outputFileName?: string; // Desired output file name from user
  timeoutId?: NodeJS.Timeout; // For auto-stopping
}

@Injectable()
export class LlmPlaywrightService implements OnModuleInit {
  private readonly logger = new Logger(LlmPlaywrightService.name);
  private activeRecordingSession: ActiveRecordingSession | null = null;
  private readonly RECORDINGS_DIR: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleGeminiFileService: GoogleGeminiFileService,
    private readonly googleGeminiImageService: GoogleGeminiImageService,
    private readonly moduleControlService: ModuleControlService,
  ) {
    this.RECORDINGS_DIR = path.join(process.cwd(), 'downloads', 'recordings');
  }

  onModuleInit() {
    if (!this.moduleControlService.isModuleEnabled('LlmPlaywrightModule')) {
      this.logger.warn(
        'LlmPlaywrightModule is currently disabled via ModuleControlService. Playwright operations will be restricted.',
      );
    }
    this.ensureRecordingsDirectoryExists();
  }

  private async ensureRecordingsDirectoryExists() {
    try {
      await fs.mkdir(this.RECORDINGS_DIR, { recursive: true });
      this.logger.log(`Ensured recording directory exists: ${this.RECORDINGS_DIR}`);
    } catch (error) {
      this.logger.error(`Failed to create recording directory: ${this.RECORDINGS_DIR}, Error: ${(error as Error).message}`);
      throw new InternalServerErrorException(`Failed to prepare recording directory: ${(error as Error).message}`);
    }
  }

  private ensureLlmPlaywrightModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('LlmPlaywrightModule')) {
      throw new ForbiddenException(
        'LLM Playwright module is currently disabled. Cannot perform Playwright operations.',
      );
    }
  }

  private async getBrowserInstance(): Promise<Browser> {
    const browserType = this.configService.get<string>('PLAYWRIGHT_BROWSER_TYPE', 'chromium');
    const headless = this.configService.get<string>('PLAYWRIGHT_HEADLESS', 'true') === 'true';

    let browser: Browser;
    const launchOptions = { headless };

    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        browser = await webkit.launch(launchOptions);
        break;
      case 'chromium':
      default:
        browser = await chromium.launch(launchOptions);
        break;
    }
    return browser;
  }

  async scrapeUrl(scrapeUrlDto: ScrapeUrlDto): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    const { url, selector, returnHtml, geminiPrompt, takeScreenshot } = scrapeUrlDto;
    let browser: Browser | null = null;
    let page: Page | null = null;
    let scrapedText: string | null = null;
    let scrapedHtml: string | null = null;
    let screenshotBase64: string | null = null; // Corrected variable name
    let geminiAnalysis: any = null;

    try {
      browser = await this.getBrowserInstance();
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      if (selector) {
        const element = await page.waitForSelector(selector);
        scrapedText = await element.textContent();
        if (returnHtml) {
          scrapedHtml = await element.innerHTML();
        }
      } else {
        scrapedText = await page.textContent('body');
        if (returnHtml) {
          scrapedHtml = await page.content();
        }
      }

      if (takeScreenshot) {
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        screenshotBase64 = screenshotBuffer.toString('base64'); // Corrected variable name
      }

      if (geminiPrompt && (scrapedText || screenshotBase64)) { // Corrected variable name
        if (scrapedText) {
          const payload: GenerateTextDto = {
            prompt: geminiPrompt,
            systemInstruction: `Analyze the following web page content:\n\n${scrapedText}`,
            // Assuming a simple text output is desired from Gemini for scraping results
            expectedOutputFormat: `Please provide a concise summary or answer based on the prompt: ${geminiPrompt}.`,
            projectRoot: '.', // Dummy value as it's not file-related
            scanPaths: [], // Dummy value
          };
          geminiAnalysis = await this.googleGeminiFileService.generateText(payload, RequestType.WEB_SCRAPE_ANALYSIS);
        }
        if (screenshotBase64) { // Corrected variable name
          const imagePayload: ImageCaptionDto = {
            image: screenshotBase64,
            prompt: geminiPrompt,
          };
          // Overwrite text analysis if image analysis is more relevant or combine them
          // For simplicity, let's assume image analysis takes precedence or enhances the result
          const imageAnalysisResult = await this.googleGeminiImageService.imageCaptioning(imagePayload, RequestType.SCREENSHOT_ANALYSIS);
          // Integrate imageAnalysisResult into geminiAnalysis. This might require a merge strategy.
          if (geminiAnalysis) {
            geminiAnalysis.imageAnalysis = imageAnalysisResult;
          } else {
            geminiAnalysis = { imageAnalysis: imageAnalysisResult };
          }
        }
      }

      return {
        success: true,
        scrapedText: scrapedText || undefined,
        scrapedHtml: scrapedHtml || undefined,
        screenshotBase64: screenshotBase64 || undefined,
        geminiAnalysis: geminiAnalysis || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape URL ${url}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(`Failed to scrape URL: ${(error as Error).message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async takeScreenshot(screenshotUrlDto: ScreenshotUrlDto): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    const { url, fullPage = true, selector, geminiPrompt } = screenshotUrlDto;
    let browser: Browser | null = null;
    let page: Page | null = null;
    let screenshotBase64: string | null = null;
    let geminiAnalysis: any = null;

    try {
      browser = await this.getBrowserInstance();
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      let screenshotBuffer: Buffer;
      if (selector) {
        const element = await page.waitForSelector(selector);
        screenshotBuffer = await element.screenshot();
      } else {
        screenshotBuffer = await page.screenshot({ fullPage });
      }
      screenshotBase64 = screenshotBuffer.toString('base64');

      if (geminiPrompt && screenshotBase64) {
        const payload: ImageCaptionDto = {
          image: screenshotBase64,
          prompt: geminiPrompt,
        };
        geminiAnalysis = await this.googleGeminiImageService.imageCaptioning(payload, RequestType.SCREENSHOT_ANALYSIS);
      }

      return {
        success: true,
        screenshotBase64: screenshotBase64,
        geminiAnalysis: geminiAnalysis || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to take screenshot of URL ${url}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(`Failed to take screenshot: ${(error as Error).message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async startScreenRecording(recordScreenDto: RecordScreenDto): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    if (this.activeRecordingSession) {
      throw new BadRequestException('A screen recording is already active. Please stop it before starting a new one.');
    }

    const { url, duration, outputFileName } = recordScreenDto;
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      await this.ensureRecordingsDirectoryExists();

      browser = await this.getBrowserInstance();

      // Create a new context with video recording enabled
      context = await browser.newContext({
        recordVideo: { dir: this.RECORDINGS_DIR },
        viewport: { width: 1280, height: 720 }, // Default viewport size for recording
      });
      page = await context.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const video = page.video();
      if (!video) {
        throw new InternalServerErrorException('Playwright video recording did not start.');
      }

      // Playwright's path() method for video returns a promise that resolves *after* the page/context is closed
      const outputPathPromise = video.path();

      this.activeRecordingSession = {
        browser,
        context,
        page,
        video,
        outputPathPromise,
        outputFileName, // Store the desired output file name
      };

      if (duration && duration > 0) {
        this.logger.log(`Recording started for ${duration} seconds.`);
        timeoutId = setTimeout(async () => {
          this.logger.log('Auto-stopping recording due to duration limit.');
          try {
            await this.stopScreenRecording();
          } catch (autoStopError) {
            this.logger.error(`Error during auto-stop recording: ${(autoStopError as Error).message}`);
          }
        }, duration * 1000);
        this.activeRecordingSession.timeoutId = timeoutId;
      }

      this.logger.log(`Screen recording started for URL: ${url}`);
      return {
        success: true,
        scrapedText: `Screen recording started for URL: ${url}.`,
        // The actual file path is not available until after recording stops.
      };
    } catch (error) {
      this.logger.error(`Failed to start screen recording for URL ${url}: ${(error as Error).message}`, (error as Error).stack);
      if (timeoutId) clearTimeout(timeoutId);
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
      this.activeRecordingSession = null;
      throw new InternalServerErrorException(`Failed to start screen recording: ${(error as Error).message}`);
    }
  }

  async stopScreenRecording(): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    if (!this.activeRecordingSession) {
      throw new BadRequestException('No active screen recording session to stop.');
    }

    const { browser, context, page, outputPathPromise, timeoutId, outputFileName: initialRequestedFileName } = this.activeRecordingSession;

    try {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await page.close(); // Closing the page triggers video save
      await context.close(); // Closing the context ensures all resources are released
      await browser.close(); // Close the browser

      const initialVideoPath = await outputPathPromise; // Get the Playwright generated path, e.g., /tmp/some-random-id.webm
      const originalExt = path.extname(initialVideoPath); // e.g., .webm

      let finalVideoName: string;
      if (initialRequestedFileName) {
        // Use the provided outputFileName, ensuring it ends with the correct extension
        const baseName = path.basename(initialRequestedFileName, path.extname(initialRequestedFileName)); // Remove any existing extension
        finalVideoName = `${baseName}${originalExt}`;
      } else {
        // Fallback to a timestamped name if no custom name was provided
        finalVideoName = `recorded-${Date.now()}${originalExt}`;
      }

      // Ensure uniqueness: add a UUID suffix just before saving to prevent overwrites
      const uniqueSuffix = uuidv4().substring(0, 8);
      const finalUniqueVideoName = `${path.basename(finalVideoName, originalExt)}-${uniqueSuffix}${originalExt}`;
      const finalUniqueVideoPath = path.join(this.RECORDINGS_DIR, finalUniqueVideoName);

      // Rename the file from Playwright's temporary path to our desired final path
      await fs.rename(initialVideoPath, finalUniqueVideoPath);
      this.logger.log(`Screen recording stopped. Video saved to: ${finalUniqueVideoPath}`);

      this.activeRecordingSession = null;
      return {
        success: true,
        recordedVideoPath: path.relative(process.cwd(), finalUniqueVideoPath), // Return relative path
        scrapedText: `Screen recording saved to: ${path.relative(process.cwd(), finalUniqueVideoPath)}`,
      };
    } catch (error) {
      this.logger.error(`Failed to stop screen recording: ${(error as Error).message}`, (error as Error).stack);
      this.activeRecordingSession = null;
      throw new InternalServerErrorException(`Failed to stop screen recording: ${(error as Error).message}`);
    }
  }
}
