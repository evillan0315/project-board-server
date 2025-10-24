import axios from 'axios';
import { PlaywrightOutputDto, ScrapeUrlDto, ScreenshotUrlDto, RecordScreenDto, PerformMultipleTasksDto } from '@/types/IPlaywrightTypes';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Service for interacting with the LLM Playwright backend API.
 */
export const llmPlaywrightService = {
  /**
   * Scrapes content from a specified URL.
   * @param data The DTO containing URL and scraping options.
   * @returns A promise that resolves to PlaywrightOutputDto.
   */
  scrapeUrl: async (data: ScrapeUrlDto): Promise<PlaywrightOutputDto> => {
    const response = await axios.post(`${BASE_URL}/api/llm-playwright/scrape`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Takes a screenshot of a specified URL.
   * @param data The DTO containing URL and screenshot options.
   * @returns A promise that resolves to PlaywrightOutputDto.
   */
  takeScreenshot: async (data: ScreenshotUrlDto): Promise<PlaywrightOutputDto> => {
    const response = await axios.post(`${BASE_URL}/api/llm-playwright/screenshot`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Starts recording the screen of a specified URL.
   * @param data The DTO containing URL and recording options.
   * @returns A promise that resolves to PlaywrightOutputDto.
   */
  startRecording: async (data: RecordScreenDto): Promise<PlaywrightOutputDto> => {
    const response = await axios.post(`${BASE_URL}/api/llm-playwright/start-recording`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Stops the active screen recording session.
   * @returns A promise that resolves to PlaywrightOutputDto.
   */
  stopRecording: async (): Promise<PlaywrightOutputDto> => {
    const response = await axios.post(`${BASE_URL}/api/llm-playwright/stop-recording`, {}, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Performs multiple orchestrated Playwright tasks.
   * @param data The DTO containing the tasks to perform.
   * @returns A promise that resolves to PlaywrightOutputDto.
   */
  performMultipleTasks: async (data: PerformMultipleTasksDto): Promise<PlaywrightOutputDto> => {
    const response = await axios.post(`${BASE_URL}/api/llm-playwright/perform-tasks`, data, {
      withCredentials: true,
    });
    return response.data;
  },
};
