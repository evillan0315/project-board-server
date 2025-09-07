import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TranslateContentDto } from './dto/translate-content.dto';

@Injectable()
export class GoogleTranslatorService {
  private readonly logger = new Logger(GoogleTranslatorService.name);
  private readonly translationApiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.GOOGLE_TRANSLATION_API_KEY;
    if (!this.apiKey) {
      throw new HttpException(
        'GOOGLE_TRANSLATION_API_KEY is not set in environment variables.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // Using Google Cloud Translation API Basic (v2) for simplicity with text/file content.
    this.translationApiUrl = 'https://translation.googleapis.com/language/translate/v2';
  }

  async translateContent(dto: TranslateContentDto): Promise<string> {
    const { content, fileData, fileName, fileMimeType, targetLanguage } = dto;

    let textToTranslate: string | undefined;

    if (fileData) {
      // For file data, assume it's base64 encoded text for now.
      // For actual binary files (PDF, DOCX), Google Translation API typically requires
      // using the document translation API or converting to text first.
      // For this implementation, we assume fileData is base64 of plain text content.
      try {
        textToTranslate = Buffer.from(fileData, 'base64').toString('utf8');
        this.logger.debug(
          `Translating content from file: ${fileName || 'unnamed file'}. MimeType: ${fileMimeType || 'unknown'}`,
        );
      } catch (error) {
        throw new HttpException(
          `Failed to decode fileData: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (content) {
      textToTranslate = content;
    } else {
      throw new HttpException(
        'Either text content or file data must be provided for translation.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!textToTranslate || textToTranslate.trim() === '') {
      return ''; // No content to translate, return empty string
    }

    try {
      const googleApiResponse = await firstValueFrom(
        this.httpService.post(
          this.translationApiUrl,
          { q: textToTranslate, target: targetLanguage },
          { params: { key: this.apiKey } },
        ),
      );

      const translatedText = googleApiResponse.data?.data?.translations?.[0]?.translatedText;

      if (!translatedText) {
        this.logger.error(
          'Google Translation API returned no translated text.',
          googleApiResponse.data,
        );
        throw new HttpException(
          'Failed to retrieve translated text from Google Translation API.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return translatedText;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Error from Google Translation API: ${errorMessage}`, error.stack);
      throw new HttpException(
        `Google Translation API failed: ${errorMessage}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
