import { Injectable, Logger, InternalServerErrorException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, firefox, webkit, Browser, Page, BrowserContext, Video } from 'playwright';
import { ScrapeUrlDto, ScreenshotUrlDto, PlaywrightOutputDto, RecordScreenDto } from './dto';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { GoogleGeminiImageService } from '../google/google-gemini/google-gemini-image/google-gemini-image.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { RequestType } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ActiveRecordingSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  video: Video;
  outputPathPromise: Promise<string>;
  outputFileName?: string;
  timeoutId?: NodeJS.Timeout;
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
    let screenshotBase64: string | null = null;
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
        screenshotBase64 = screenshotBuffer.toString('base64');
      }

      if (geminiPrompt && (scrapedText || screenshotBase64)) {
        if (scrapedText) {
          const payload: GenerateTextDto = {
            prompt: geminiPrompt,
            systemInstruction: `Analyze the following web page content:\n\n${scrapedText}\n\nPlease provide a concise summary or answer based on the prompt: ${geminiPrompt}.`,
          };
          geminiAnalysis = await this.googleGeminiFileService.generateText(payload, RequestType.WEB_SCRAPE_ANALYSIS);
        }
        if (screenshotBase64) {
          const imageAnalysisResult = await this.googleGeminiImageService.captionImageFromBase64(
            screenshotBase64,
            geminiPrompt,
            'image/png', // Assuming PNG for screenshots by default
            RequestType.SCREENSHOT_ANALYSIS,
          );
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
      screenshotBase66 = screenshotBuffer.toString('base64');

      if (geminiPrompt && screenshotBase66) {
        geminiAnalysis = await this.googleGeminiImageService.captionImageFromBase64(
          screenshotBase66,
          geminiPrompt,
          'image/png',
          RequestType.SCREENSHOT_ANALYSIS,
        );
      }

      return {
        success: true,
        screenshotBase66: screenshotBase66,
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
    let video: Video | null = null;
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      await this.ensureRecordingsDirectoryExists();

      browser = await this.getBrowserInstance();

      context = await browser.newContext({
        recordVideo: { dir: this.RECORDINGS_DIR },
        viewport: { width: 1280, height: 720 },
      });
      page = await context.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      video = page.video();
      if (!video) {
        throw new InternalServerErrorException('Playwright video recording did not start.');
      }

      const outputPathPromise = video.path();

      this.activeRecordingSession = {
        browser: browser as Browser,
        context: context as BrowserContext,
        page: page as Page,
        video: video as Video,
        outputPathPromise,
        outputFileName,
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
        if (this.activeRecordingSession) {
          this.activeRecordingSession.timeoutId = timeoutId;
        }
      }

      this.logger.log(`Screen recording started for URL: ${url}`);
      return {
        success: true,
        scrapedText: `Screen recording started for URL: ${url}.`,
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
      await page.close();
      await context.close();
      await browser.close();

      const initialVideoPath = await outputPathPromise;
      const originalExt = path.extname(initialVideoPath);

      let finalVideoName: string;
      if (initialRequestedFileName) {
        const baseName = path.basename(initialRequestedFileName, path.extname(initialRequestedFileName));
        finalVideoName = `${baseName}${originalExt}`;
      } else {
        finalVideoName = `recorded-${Date.now()}${originalExt}`;
      }

      const uniqueSuffix = uuidv4().substring(0, 8);
      const finalUniqueVideoName = `${path.basename(finalVideoName, originalExt)}-${uniqueSuffix}${originalExt}`;
      const finalUniqueVideoPath = path.join(this.RECORDINGS_DIR, finalUniqueVideoName);

      await fs.rename(initialVideoPath, finalUniqueVideoPath);
      this.logger.log(`Screen recording stopped. Video saved to: ${finalUniqueVideoPath}`);

      this.activeRecordingSession = null;
      return {
        success: true,
        recordedVideoPath: path.relative(process.cwd(), finalUniqueVideoPath),
        scrapedText: `Screen recording saved to: ${path.relative(process.cwd(), finalUniqueVideoPath)}`,
      };
    } catch (error) {
      this.logger.error(`Failed to stop screen recording: ${(error as Error).message}`, (error as Error).stack);
      this.activeRecordingSession = null;
      throw new InternalServerErrorException(`Failed to stop screen recording: ${(error as Error).message}`);
    }
  }
}
