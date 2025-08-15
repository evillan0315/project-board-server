import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class GoogleGeminiImageService {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    this.model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';

    if (!apiKey) {
      throw new HttpException(
        'GOOGLE_GEMINI_API_KEY is not set',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a caption for an image from a URL.
   * @param imageUrl - Publicly accessible image URL.
   */
  async captionImageFromUrl(
    imageUrl: string,
    prompt = 'Caption this image.',
  ): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new HttpException(
          'Failed to fetch image from URL',
          HttpStatus.BAD_REQUEST,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64ImageData = Buffer.from(arrayBuffer).toString('base64');

      return await this.sendToGemini(base64ImageData, prompt);
    } catch (error) {
      throw new HttpException(
        `Error processing image URL: ${error.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Generates a caption for an image from a local file path.
   * @param filePath - Absolute or relative path to the image file.
   */
  async captionImageFromFile(
    filePath: string,
    prompt = 'Caption this image.',
  ): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new HttpException(
          `File not found: ${absolutePath}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const base64ImageData = fs.readFileSync(absolutePath, {
        encoding: 'base64',
      });
      return await this.sendToGemini(base64ImageData, prompt);
    } catch (error) {
      throw new HttpException(
        `Error processing local file: ${error.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Shared method to send image data and prompt to Gemini.
   */
  private async sendToGemini(
    base64ImageData: string,
    prompt: string,
  ): Promise<string> {
    const contents = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        },
      },
      { text: prompt },
    ];

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    return result?.text?.trim() || 'No caption generated';
  }
}
