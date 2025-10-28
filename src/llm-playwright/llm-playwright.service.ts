import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  chromium,
  firefox,
  webkit,
  Browser,
  Page,
  BrowserContext,
  Video,
} from 'playwright';
import {
  ScrapeUrlDto,
  ScreenshotUrlDto,
  PlaywrightOutputDto,
  RecordScreenDto,
  PerformMultipleTasksDto,
  NavigationStepDto,
  PlaywrightNavigationAction,
  LoginCredentialsDto,
} from './dto';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { GoogleGeminiImageService } from '../google/google-gemini/google-gemini-image.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { RequestType } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LlmOutputPlayDto } from './dto/llm-output-play.dto';

interface ActiveRecordingSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  video: Video;
  outputPathPromise: Promise<string>;
  outputFileName?: string;
  // Removed timeoutId as automatic duration stopping is no longer supported
}

@Injectable()
export class LlmPlaywrightService implements OnModuleInit {
  private readonly logger = new Logger(LlmPlaywrightService.name);
  private activeRecordingSession: ActiveRecordingSession | null = null;
  private readonly RECORDINGS_DIR: string;
  private readonly PLAYWRIGHT_DEFAULT_TIMEOUT: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleGeminiFileService: GoogleGeminiFileService,
    private readonly googleGeminiImageService: GoogleGeminiImageService,
    private readonly moduleControlService: ModuleControlService,
  ) {
    this.RECORDINGS_DIR = path.join(process.cwd(), 'downloads', 'recordings');
    this.PLAYWRIGHT_DEFAULT_TIMEOUT = this.configService.get<number>(
      'PLAYWRIGHT_TIMEOUT_MS',
      30000,
    ); // Default to 30 seconds
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
      this.logger.log(
        `Ensured recording directory exists: ${this.RECORDINGS_DIR}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create recording directory: ${this.RECORDINGS_DIR}, Error: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Failed to prepare recording directory: ${(error as Error).message}`,
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
    const browserType = this.configService.get<string>(
      'PLAYWRIGHT_BROWSER_TYPE',
      'chromium',
    );
    const headless =
      this.configService.get<string>('PLAYWRIGHT_HEADLESS', 'true') === 'true';

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

    const { url, selector, returnHtml, geminiPrompt, takeScreenshot } =
      scrapeUrlDto;
    let browser: Browser | null = null;
    let page: Page | null = null;
    let scrapedText: string | null = null;
    let scrapedHtml: string | null = null;
    let screenshotBase64: string | null = null;
    let geminiAnalysis: LlmOutputPlayDto | undefined = undefined; // Initialize as undefined

    try {
      browser = await this.getBrowserInstance();
      page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      });

      if (selector) {
        const element = await page.waitForSelector(selector, {
          timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
        });
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

      if (geminiPrompt) {
        // Only proceed with Gemini if a prompt is provided
        if (scrapedText) {
          const payload: GenerateTextDto = {
            prompt: geminiPrompt,
            systemInstruction: `Analyze the following web page content:\n\n${scrapedText}\n\nPlease provide a concise summary or answer based on the prompt: ${geminiPrompt}.`,
          };
          const textAnalysisResponse =
            await this.googleGeminiFileService.generateText(
              payload,
              RequestType.WEB_SCRAPE_ANALYSIS,
            );
          // Ensure the result is an object. If generateText returns a string, wrap it.
          if (typeof textAnalysisResponse === 'string') {
            geminiAnalysis = { summary: textAnalysisResponse };
          } else {
            geminiAnalysis = textAnalysisResponse as LlmOutputPlayDto; // Assume it's already an object
          }
        }

        if (screenshotBase64) {
          const imageAnalysisResult =
            await this.googleGeminiImageService.captionImageFromBase64(
              screenshotBase64,
              geminiPrompt,
              'image/png',
              RequestType.SCREENSHOT_ANALYSIS,
            );

          // Ensure geminiAnalysis is an object before adding imageAnalysis.
          if (!geminiAnalysis) {
            geminiAnalysis = {}; // Initialize as empty LlmOutputPlayDto if no text analysis happened yet
          }

          // Assign the image analysis result to the 'imageAnalysis' property
          // If imageAnalysisResult is a string, wrap it in an object with a 'caption' property
          if (typeof imageAnalysisResult === 'string') {
            geminiAnalysis.imageAnalysis = { caption: imageAnalysisResult };
          } else {
            geminiAnalysis.imageAnalysis = imageAnalysisResult; // Assume it's already an object
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
      this.logger.error(
        `Failed to scrape URL ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to scrape URL: ${(error as Error).message}`,
      );
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async takeScreenshot(
    screenshotUrlDto: ScreenshotUrlDto,
  ): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    const { url, fullPage = true, selector, geminiPrompt } = screenshotUrlDto;
    let browser: Browser | null = null;
    let page: Page | null = null;
    let screenshotBase64: string | null = null;
    let geminiAnalysis: LlmOutputPlayDto | undefined = undefined; // Initialize as undefined

    try {
      browser = await this.getBrowserInstance();
      page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      });

      let screenshotBuffer: Buffer;
      if (selector) {
        const element = await page.waitForSelector(selector, {
          timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
        });
        screenshotBuffer = await element.screenshot();
      } else {
        screenshotBuffer = await page.screenshot({ fullPage });
      }
      screenshotBase64 = screenshotBuffer.toString('base64');

      if (geminiPrompt && screenshotBase64) {
        const imageAnalysisResult =
          await this.googleGeminiImageService.captionImageFromBase64(
            screenshotBase64,
            geminiPrompt,
            'image/png',
            RequestType.SCREENSHOT_ANALYSIS,
          );
        // Ensure geminiAnalysis is an object before adding imageAnalysis.
        if (!geminiAnalysis) {
          geminiAnalysis = {}; // Initialize as empty LlmOutputPlayDto
        }

        // Assign the image analysis result to the 'imageAnalysis' property
        if (typeof imageAnalysisResult === 'string') {
          geminiAnalysis.imageAnalysis = { caption: imageAnalysisResult };
        } else {
          geminiAnalysis.imageAnalysis = imageAnalysisResult;
        }
      }

      return {
        success: true,
        screenshotBase64: screenshotBase64,
        geminiAnalysis: geminiAnalysis || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to take screenshot of URL ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to take screenshot: ${(error as Error).message}`,
      );
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async startScreenRecording(
    recordScreenDto: RecordScreenDto,
  ): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    if (this.activeRecordingSession) {
      throw new BadRequestException(
        'A screen recording is already active. Please stop it before starting a new one.',
      );
    }

    const { url, outputFileName } = recordScreenDto; // 'duration' is removed
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    let video: Video | null = null;

    try {
      await this.ensureRecordingsDirectoryExists();

      browser = await this.getBrowserInstance();

      context = await browser.newContext({
        recordVideo: { dir: this.RECORDINGS_DIR },
        viewport: { width: 1280, height: 720 },
      });
      page = await context.newPage();

      video = page.video();
      if (!video) {
        throw new InternalServerErrorException(
          'Playwright video recording did not start.',
        );
      }

      const outputPathPromise = video.path();

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      });

      this.activeRecordingSession = {
        browser: browser as Browser,
        context: context as BrowserContext,
        page: page as Page,
        video: video as Video,
        outputPathPromise,
        outputFileName,
      };

      this.logger.log(
        `Screen recording started for URL: ${url}. It will continue until explicitly stopped.`,
      );
      return {
        success: true,
        scrapedText: `Screen recording started for URL: ${url}. It will continue until explicitly stopped.`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start screen recording for URL ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // No timeoutId to clear anymore
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
      this.activeRecordingSession = null;
      throw new InternalServerErrorException(
        `Failed to start screen recording: ${(error as Error).message}`,
      );
    }
  }

  async stopScreenRecording(): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    if (!this.activeRecordingSession) {
      throw new BadRequestException(
        'No active screen recording session to stop.',
      );
    }

    const {
      browser,
      context,
      page,
      outputPathPromise,
      outputFileName: initialRequestedFileName,
    } = this.activeRecordingSession;

    try {
      // No timeoutId to clear anymore
      await page.close();
      await context.close();
      await browser.close();

      const initialVideoPath = await outputPathPromise;
      const originalExt = path.extname(initialVideoPath);
      const baseNameWithoutExt = initialRequestedFileName
        ? path.basename(
            initialRequestedFileName,
            path.extname(initialRequestedFileName),
          )
        : `recorded-${Date.now()}`;
      const uniqueSuffix = uuidv4().substring(0, 8);

      const finalVideoName = `${baseNameWithoutExt}-${uniqueSuffix}${originalExt}`;
      const finalUniqueVideoPath = path.join(
        this.RECORDINGS_DIR,
        finalVideoName,
      );

      await fs.mkdir(path.dirname(finalUniqueVideoPath), { recursive: true });
      await fs.rename(initialVideoPath, finalUniqueVideoPath);
      this.logger.log(
        `Screen recording stopped. Video saved to: ${finalUniqueVideoPath}`,
      );

      this.activeRecordingSession = null;
      return {
        success: true,
        recordedVideoPath: path.relative(process.cwd(), finalUniqueVideoPath),
        scrapedText: `Screen recording saved to: ${path.relative(process.cwd(), finalUniqueVideoPath)}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to stop screen recording: ${(error as Error).message}`,
        (error as Error).stack,
      );
      this.activeRecordingSession = null;
      throw new InternalServerErrorException(
        `Failed to stop screen recording: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Navigates to a specified URL.
   * @param page The Playwright page object.
   * @param url The URL to navigate to.
   */
  private async _performNavigate(page: Page, url: string): Promise<void> {
    this.logger.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
  }

  /**
   * Clicks an element identified by a CSS selector.
   * @param page The Playwright page object.
   * @param selector The CSS selector of the element to click.
   */
  private async _performClick(page: Page, selector: string): Promise<void> {
    this.logger.log(`Clicking element with selector: ${selector}`);
    await page.waitForSelector(selector, {
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
    await page.click(selector);
    await page
      .waitForNavigation({
        waitUntil: 'networkidle',
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      })
      .catch((e) =>
        this.logger.warn(
          `Click navigation wait timed out or failed in _performClick: ${(e as Error).message}`,
        ),
      );
  }

  /**
   * Types text into an input element identified by a CSS selector.
   * @param page The Playwright page object.
   * @param selector The CSS selector of the input element.
   * @param value The text value to type.
   */
  private async _performType(
    page: Page,
    selector: string,
    value: string,
  ): Promise<void> {
    this.logger.log(`Typing into element with selector: ${selector}`);
    await page.waitForSelector(selector, {
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
    await page.fill(selector, value);
  }

  /**
   * Performs a login operation using provided credentials and selectors.
   * @param page The Playwright page object.
   * @param credentials Login credentials and selectors.
   */
  private async _performLogin(
    page: Page,
    credentials: LoginCredentialsDto,
  ): Promise<void> {
    const {
      username,
      password,
      usernameSelector,
      passwordSelector,
      submitSelector,
    } = credentials;
    this.logger.log(
      `Attempting login with username selector: ${usernameSelector || 'N/A'}, password selector: ${passwordSelector || 'N/A'}, submit selector: ${submitSelector || 'N/A'}`,
    );

    if (!usernameSelector) {
      this.logger.warn(
        'Login action skipped: usernameSelector is required for login but not provided.',
      );
      throw new BadRequestException(
        'usernameSelector is required for login action.',
      );
    }
    if (!passwordSelector) {
      this.logger.warn(
        'Login action skipped: passwordSelector is required for login but not provided.',
      );
      throw new BadRequestException(
        'passwordSelector is required for login action.',
      );
    }
    if (!submitSelector) {
      this.logger.warn(
        'Login action skipped: submitSelector is required for login but not provided.',
      );
      throw new BadRequestException(
        'submitSelector is required for login action.',
      );
    }

    await page.waitForSelector(usernameSelector, {
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
    await page.fill(usernameSelector, username ?? '');
    if (username === undefined) {
      this.logger.debug(
        `No username value provided for selector: ${usernameSelector}, filling with empty string.`,
      );
    }

    await page.waitForSelector(passwordSelector, {
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
    await page.fill(passwordSelector, password ?? '');
    if (password === undefined) {
      this.logger.debug(
        `No password value provided for selector: ${passwordSelector}, filling with empty string.`,
      );
    }

    await page.waitForSelector(submitSelector, {
      timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
    });
    await page.click(submitSelector);
    this.logger.log('Login form submitted.');
    await page
      .waitForNavigation({
        waitUntil: 'networkidle',
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      })
      .catch((e) =>
        this.logger.warn(
          `Login navigation wait timed out or failed: ${(e as Error).message}`,
        ),
      );
  }

  /**
   * Performs a wait operation.
   * @param page The Playwright page object.
   * @param durationMs Duration in milliseconds to wait.
   * @param selector CSS selector to wait for.
   */
  private async _performWait(
    page: Page,
    durationMs?: number,
    selector?: string,
  ): Promise<void> {
    if (durationMs !== undefined && durationMs > 0) {
      this.logger.log(`Waiting for ${durationMs}ms.`);
      await page.waitForTimeout(durationMs);
    } else if (selector) {
      this.logger.log(`Waiting for selector: ${selector}`);
      await page.waitForSelector(selector, {
        timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
      });
    } else {
      throw new BadRequestException(
        'WAIT action requires either durationMs or selector.',
      );
    }
  }

  /**
   * Parses a natural language Playwright instruction string into a list of NavigationStepDto.
   * This method specifically looks for a composite login instruction pattern provided by the user.
   * @param instruction The natural language instruction string.
   * @returns An array of NavigationStepDto. Returns empty array if no matching pattern is found.
   */
  private _parsePlaywrightInstruction(
    instruction: string,
  ): NavigationStepDto[] {
    const steps: NavigationStepDto[] = [];

    const loginRegex =
      /Enter Email address:(?<email>[^ ]+) in the \((?<emailSelector>[^)]+)\) and Password:(?<password>[^ ]+) in the \((?<passwordSelector>[^)]+)\) field and click the Sign in \((?<submitSelector>[^)]+)\) button/i;

    const loginMatch = instruction.match(loginRegex);

    if (loginMatch?.groups) {
      const {
        email,
        emailSelector,
        password,
        passwordSelector,
        submitSelector,
      } = loginMatch.groups;
      steps.push({
        action: PlaywrightNavigationAction.LOGIN,
        loginCredentials: {
          username: email,
          usernameSelector: emailSelector,
          password: password,
          passwordSelector: passwordSelector,
          submitSelector: submitSelector,
        },
      });
      this.logger.debug(
        `Parsed login instruction: Email: ${email}, EmailSelector: ${emailSelector}, PasswordSelector: ${passwordSelector}, SubmitSelector: ${submitSelector}`,
      );
    } else {
      this.logger.debug(
        `No matching Playwright instruction pattern found for: "${instruction}".`,
      );
    }

    return steps;
  }

  /**
   * Performs multiple orchestrated Playwright tasks (scrape, screenshot) on a URL
   * and optionally analyzes the combined results with Gemini AI based on a high-level instruction.
   */
  async performMultipleTasks(
    dto: PerformMultipleTasksDto,
  ): Promise<PlaywrightOutputDto> {
    this.ensureLlmPlaywrightModuleEnabled();

    const {
      url,
      llmInstruction,
      navigationSteps: initialNavigationSteps = [],
      shouldScrape = true,
      scrapeSelector,
      returnHtmlForScrape = false,
      shouldTakeScreenshot = true,
      screenshotFullPage = true,
      screenshotSelector,
      shouldRecordScreen = false,
      // recordDuration is removed
      recordOutputFileName,
    } = dto;

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    let video: Video | null = null;
    let scrapedText: string | null = null;
    let scrapedHtml: string | null = null;
    let screenshotBase64: string | null = null;
    let recordedVideoPath: string | null = null;
    let geminiAnalysis: LlmOutputPlayDto | undefined = undefined; // Initialize as undefined
    let recordingStartedByThisTask = false;
    let effectiveGeminiPrompt: string | undefined = llmInstruction;

    let finalNavigationSteps: NavigationStepDto[] = [...initialNavigationSteps];

    if (llmInstruction) {
      const parsedPlaywrightSteps =
        this._parsePlaywrightInstruction(llmInstruction);
      if (parsedPlaywrightSteps.length > 0) {
        finalNavigationSteps = [
          ...parsedPlaywrightSteps,
          ...finalNavigationSteps,
        ];
        this.logger.log(
          `Prepended ${parsedPlaywrightSteps.length} steps from llmInstruction (interpreted as Playwright command).`,
        );
        effectiveGeminiPrompt = undefined;
      }
    }

    try {
      browser = await this.getBrowserInstance();

      if (shouldRecordScreen) {
        if (this.activeRecordingSession) {
          throw new BadRequestException(
            'A screen recording is already active. Please stop it before starting a new one.',
          );
        }

        await this.ensureRecordingsDirectoryExists();

        context = await browser.newContext({
          recordVideo: { dir: this.RECORDINGS_DIR },
          viewport: { width: 1280, height: 720 },
        });
        page = await context.newPage();
        recordingStartedByThisTask = true;

        video = page.video();
        if (!video) {
          throw new InternalServerErrorException(
            'Playwright video recording did not start within performMultipleTasks.',
          );
        }

        const outputPathPromise = video.path();

        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
        });

        this.activeRecordingSession = {
          browser: browser as Browser,
          context: context as BrowserContext,
          page: page as Page,
          video: video as Video,
          outputPathPromise,
          outputFileName: recordOutputFileName,
        };

        // Removed setTimeout for automatic duration stopping
        this.logger.log(
          `Screen recording initiated for URL: ${url} within performMultipleTasks. It will stop when all tasks are complete.`,
        );
      } else {
        page = await browser.newPage();
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
        });
      }

      if (finalNavigationSteps && finalNavigationSteps.length > 0) {
        for (const step of finalNavigationSteps) {
          try {
            switch (step.action) {
              case PlaywrightNavigationAction.NAVIGATE:
                if (!step.url)
                  throw new BadRequestException(
                    'URL is required for NAVIGATE action.',
                  );
                await this._performNavigate(page, step.url);
                break;
              case PlaywrightNavigationAction.CLICK:
                if (!step.selector)
                  throw new BadRequestException(
                    'Selector is required for CLICK action.',
                  );
                await this._performClick(page, step.selector);
                break;
              case PlaywrightNavigationAction.TYPE:
                if (!step.selector || step.value === undefined)
                  throw new BadRequestException(
                    'Selector and value are required for TYPE action.',
                  );
                await this._performType(page, step.selector, step.value);
                break;
              case PlaywrightNavigationAction.LOGIN:
                if (!step.loginCredentials)
                  throw new BadRequestException(
                    'Login credentials are required for LOGIN action.',
                  );
                await this._performLogin(page, step.loginCredentials);
                break;
              case PlaywrightNavigationAction.WAIT:
                await this._performWait(page, step.durationMs, step.selector);
                break;
              default:
                this.logger.warn(`Unknown navigation action: ${step.action}`);
                break;
            }
          } catch (navError) {
            this.logger.error(
              `Failed to perform navigation step ${step.action}: ${(navError as Error).message}`,
            );
            throw new InternalServerErrorException(
              `Failed during navigation step: ${step.action} - ${(navError as Error).message}`,
            );
          }
        }
      }

      if (shouldScrape) {
        try {
          if (scrapeSelector) {
            const element = await page.waitForSelector(scrapeSelector, {
              timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
            });
            scrapedText = await element.textContent();
            if (returnHtmlForScrape) {
              scrapedHtml = await element.innerHTML();
            }
          } else {
            scrapedText = await page.textContent('body');
            if (returnHtmlForScrape) {
              scrapedHtml = await page.content();
            }
          }
          this.logger.log(`Scraped content from ${url}`);
        } catch (scrapeError) {
          this.logger.warn(
            `Failed to scrape content from ${url}: ${(scrapeError as Error).message}`,
          );
          scrapedText = `Failed to scrape content: ${(scrapeError as Error).message}`;
        }
      }

      if (shouldTakeScreenshot) {
        try {
          let screenshotBuffer: Buffer;
          if (screenshotSelector) {
            const element = await page.waitForSelector(screenshotSelector, {
              timeout: this.PLAYWRIGHT_DEFAULT_TIMEOUT,
            });
            screenshotBuffer = await element.screenshot();
          } else {
            screenshotBuffer = await page.screenshot({
              fullPage: screenshotFullPage,
            });
          }
          screenshotBase64 = screenshotBuffer.toString('base64');
          this.logger.log(`Took screenshot of ${url}`);
        } catch (screenshotError) {
          this.logger.warn(
            `Failed to take screenshot of ${url}: ${(screenshotError as Error).message}`,
          );
        }
      }

      if (recordingStartedByThisTask && this.activeRecordingSession) {
        const stopResult = await this.stopScreenRecording();
        recordedVideoPath = stopResult.recordedVideoPath || null;
      } else if (page) {
        await page.close();
        if (browser) await browser.close();
      }

      if (effectiveGeminiPrompt) {
        let combinedContext = '';
        if (scrapedText) {
          combinedContext += `Web Page Content:\n${scrapedText}\n\n`;
        }
        if (scrapedHtml) {
          combinedContext += `Web Page HTML:\n${scrapedHtml}\n\n`;
        }
        if (recordedVideoPath) {
          combinedContext += `Recorded Video saved at: ${recordedVideoPath}\n\n`;
        }

        if (combinedContext) {
          const textPayload: GenerateTextDto = {
            prompt: effectiveGeminiPrompt,
            systemInstruction: `You are an AI assistant. Analyze the provided web context to fulfill the user's request. \n\nWeb Context:\n${combinedContext}\n\nConsider the web context carefully when responding to the user's prompt. `,
          };
          const textAnalysisResponse =
            await this.googleGeminiFileService.generateText(
              textPayload,
              RequestType.PLAYWRIGHT_TASK_ANALYSIS,
            );
          if (typeof textAnalysisResponse === 'string') {
            geminiAnalysis = { summary: textAnalysisResponse };
          } else {
            geminiAnalysis = textAnalysisResponse as LlmOutputPlayDto;
          }
        }

        if (screenshotBase64) {
          const imageAnalysisResult =
            await this.googleGeminiImageService.captionImageFromBase64(
              screenshotBase64,
              effectiveGeminiPrompt,
              'image/png',
              RequestType.PLAYWRIGHT_TASK_ANALYSIS,
            );
          if (!geminiAnalysis) {
            geminiAnalysis = {};
          }
          if (typeof imageAnalysisResult === 'string') {
            geminiAnalysis.imageAnalysis = { caption: imageAnalysisResult };
          } else {
            geminiAnalysis.imageAnalysis = imageAnalysisResult;
          }
        }
      }

      return {
        success: true,
        scrapedText: scrapedText || undefined,
        scrapedHtml: scrapedHtml || undefined,
        screenshotBase64: screenshotBase64 || undefined,
        recordedVideoPath: recordedVideoPath || undefined,
        geminiAnalysis: geminiAnalysis || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform multiple tasks on URL ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (this.activeRecordingSession) {
        // No timeoutId to clear anymore
        if (this.activeRecordingSession.page) {
          try {
            await this.activeRecordingSession.page.close();
          } catch (e) {
            this.logger.error(
              `Error closing page on task error: ${(e as Error).message}`,
            );
          }
        }
        if (this.activeRecordingSession.context) {
          try {
            await this.activeRecordingSession.context.close();
          } catch (e) {
            this.logger.error(
              `Error closing context on task error: ${(e as Error).message}`,
            );
          }
        }
        if (this.activeRecordingSession.browser) {
          try {
            await this.activeRecordingSession.browser.close();
          } catch (e) {
            this.logger.error(
              `Error closing browser on task error: ${(e as Error).message}`,
            );
          }
        }
        this.activeRecordingSession = null;
      } else if (page) {
        try {
          await page.close();
        } catch (e) {
          this.logger.error(
            `Error closing page on task error: ${(e as Error).message}`,
          );
        }
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            this.logger.error(
              `Error closing browser on task error: ${(e as Error).message}`,
            );
          }
        }
      }

      throw new InternalServerErrorException(
        `Failed to perform multiple tasks: ${(error as Error).message}`,
      );
    }
  }
}
