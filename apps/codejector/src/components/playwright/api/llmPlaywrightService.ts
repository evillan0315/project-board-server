import { fetchWithAuth, handleResponse, API_BASE_URL } from '@/api/fetch';
import {
  IScrapeUrlDto,
  IScreenshotUrlDto,
  IRecordScreenDto,
  IPerformMultipleTasksDto,
  IPlaywrightOutputDto,
} from '../types/IPlaywrightTypes';

const LLM_PLAYWRIGHT_API_BASE = `${API_BASE_URL}/llm-playwright`;

export const llmPlaywrightService = {
  /**
   * Scrapes content from a specified URL using Playwright.
   * @param data - The DTO containing the URL and optional selector/prompt.
   * @returns A promise that resolves to IPlaywrightOutputDto.
   */
  scrapeUrl: async (data: IScrapeUrlDto): Promise<IPlaywrightOutputDto> => {
    const response = await fetchWithAuth(`${LLM_PLAYWRIGHT_API_BASE}/scrape`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<IPlaywrightOutputDto>(response);
  },

  /**
   * Takes a screenshot of a specified URL using Playwright.
   * @param data - The DTO containing the URL and optional fullPage/selector/prompt.
   * @returns A promise that resolves to IPlaywrightOutputDto.
   */
  takeScreenshot: async (
    data: IScreenshotUrlDto,
  ): Promise<IPlaywrightOutputDto> => {
    const response = await fetchWithAuth(
      `${LLM_PLAYWRIGHT_API_BASE}/screenshot`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return handleResponse<IPlaywrightOutputDto>(response);
  },

  /**
   * Starts recording the screen of a specified URL using Playwright.
   * @param data - The DTO containing the URL, duration, and output file name.
   * @returns A promise that resolves to IPlaywrightOutputDto.
   */
  startRecording: async (
    data: IRecordScreenDto,
  ): Promise<IPlaywrightOutputDto> => {
    const response = await fetchWithAuth(
      `${LLM_PLAYWRIGHT_API_BASE}/start-recording`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return handleResponse<IPlaywrightOutputDto>(response);
  },

  /**
   * Stops the active screen recording session.
   * @returns A promise that resolves to IPlaywrightOutputDto.
   */
  stopRecording: async (): Promise<IPlaywrightOutputDto> => {
    const response = await fetchWithAuth(
      `${LLM_PLAYWRIGHT_API_BASE}/stop-recording`,
      {
        method: 'POST',
      },
    );
    return handleResponse<IPlaywrightOutputDto>(response);
  },

  /**
   * Performs multiple orchestrated Playwright tasks and optionally analyzes the results with Gemini AI.
   * @param data - The DTO containing the URL, navigation steps, and task options.
   * @returns A promise that resolves to IPlaywrightOutputDto.
   */
  performMultipleTasks: async (
    data: IPerformMultipleTasksDto,
  ): Promise<IPlaywrightOutputDto> => {
    const response = await fetchWithAuth(
      `${LLM_PLAYWRIGHT_API_BASE}/perform-tasks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return handleResponse<IPlaywrightOutputDto>(response);
  },
};
