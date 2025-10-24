/**
 * Represents the possible navigation actions for Playwright.
 */
export enum PlaywrightNavigationAction {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  TYPE = 'type',
  LOGIN = 'login',
  WAIT = 'wait',
}

/**
 * DTO for specifying login credentials and selectors for a web page.
 */
export interface ILoginCredentialsDto {
  username?: string;
  password?: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
}

/**
 * DTO for a single navigation step within a Playwright task.
 */
export interface INavigationStepDto {
  action: PlaywrightNavigationAction;
  url?: string;
  selector?: string;
  value?: string;
  loginCredentials?: ILoginCredentialsDto;
  durationMs?: number; // New: Duration in milliseconds for WAIT action
}

/**
 * DTO for scraping a URL.
 */
export interface IScrapeUrlDto {
  url: string;
  selector?: string;
  returnHtml?: boolean;
  geminiPrompt?: string;
  takeScreenshot?: boolean;
}

/**
 * DTO for taking a screenshot of a URL.
 */
export interface IScreenshotUrlDto {
  url: string;
  fullPage?: boolean;
  selector?: string;
  geminiPrompt?: string;
}

/**
 * DTO for initiating a screen recording session.
 */
export interface IRecordScreenDto {
  url: string;
  duration?: number;
  outputFileName?: string;
}

/**
 * DTO for performing multiple orchestrated Playwright tasks (scrape, screenshot)
 * with an optional overarching LLM analysis.
 */
export interface IPerformMultipleTasksDto {
  url: string;
  llmInstruction?: string;
  navigationSteps?: INavigationStepDto[];
  shouldScrape?: boolean;
  scrapeSelector?: string;
  returnHtmlForScrape?: boolean;
  shouldTakeScreenshot?: boolean;
  screenshotFullPage?: boolean;
  screenshotSelector?: string;
  shouldRecordScreen?: boolean;
  recordDuration?: number;
  recordOutputFileName?: string;
}

/**
 * Defines the common LLM output structure for frontend display.
 */
export interface IFrontendLlmOutputDto {
  title?: string;
  summary?: string;
  thoughtProcess?: string;
  documentation?: string;
}

/**
 * Defines the AI analysis DTO for Playwright outputs on the frontend.
 * This mirrors the backend's LlmOutputPlayDto, but without recursive PlaywrightOutputDto to avoid circular type issues directly.
 */
export interface IFrontendLlmOutputPlayDto extends IFrontendLlmOutputDto {
  imageAnalysis?: any;
  // Added to align with backend LlmOutputPlayDto, if backend sends it
  playwrightOutput?: IPlaywrightOutputDto; // Added for type consistency
}

/**
 * DTO for the output of Playwright operations.
 */
export interface IPlaywrightOutputDto {
  scrapedText?: string;
  scrapedHtml?: string;
  screenshotBase64?: string;
  recordedVideoPath?: string;
  geminiAnalysis?: IFrontendLlmOutputPlayDto; // Updated to reference the more specific frontend LLM analysis type
  success: boolean;
  errorMessage?: string;
}
