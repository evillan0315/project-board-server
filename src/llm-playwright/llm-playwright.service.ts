import { Injectable, Logger, InternalServerErrorException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import { ScrapeUrlDto, ScreenshotUrlDto, PlaywrightOutputDto } from './dto';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { GoogleGeminiImageService } from '../google/google-gemini/google-gemini-image.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { ImageCaptionDto } from '../google/google-gemini/dto/image-caption.dto';
import { RequestType } from '@prisma/client';

@Injectable()
export class LlmPlaywrightService implements OnModuleInit {
  private readonly logger = new Logger(LlmPlaywrightService.name);
  private browser: Browser | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleGeminiFileService: GoogleGeminiFileService,
    private readonly googleGeminiImageService: GoogleGeminiImageService,
    private readonly moduleControlService: ModuleControlService,
  ) {}

  onModuleInit() {
    if (!this.moduleControlService.isModuleEnabled('LlmPlaywrightModule')) {
      this.logger.warn(
        'LlmPlaywrightModule is currently disabled via ModuleControlService. Playwright operations will be restricted.',
      );
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
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless });
        break;
      case 'chromium':
      default:
        browser = await chromium.launch({ headless });
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
            systemInstruction: `Analyze the following web page content:\n\n${scrapedText}`,
            // Assuming a simple text output is desired from Gemini for scraping results
            expectedOutputFormat: `Please provide a concise summary or answer based on the prompt: ${geminiPrompt}.`,
            projectRoot: '.', // Dummy value as it's not file-related
            scanPaths: [], // Dummy value
          };
          geminiAnalysis = await this.googleGeminiFileService.generateText(payload, RequestType.WEB_SCRAPE_ANALYSIS);
        }
        if (screenshotBase64) {
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
      this.logger.error(`Failed to scrape URL ${url}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to scrape URL: ${error.message}`);
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
        screenshotBase64,
        geminiAnalysis: geminiAnalysis || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to take screenshot of URL ${url}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to take screenshot: ${error.message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}
