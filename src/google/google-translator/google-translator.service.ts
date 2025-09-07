import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { TranslateContentDto } from './dto/translate-content.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class GoogleTranslatorService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://translation.googleapis.com/language/translate/v2';
  private readonly logger = new Logger(GoogleTranslatorService.name);

  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.GOOGLE_TRANSLATION_API_KEY;
    if (!apiKey) {
      this.logger.error('GOOGLE_TRANSLATION_API_KEY is not set in environment variables.');
      throw new HttpException(
        'Google Translation API key is missing.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.apiKey = apiKey;
  }

  async translateContent(dto: TranslateContentDto): Promise<string> {
    const { content, fileData, fileMimeType, targetLanguage, returnInOriginalFormat } = dto;

    if (!content && !fileData) {
      throw new HttpException(
        'Either content text or file data must be provided for translation.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let textToTranslate: string;

    if (fileData) {
      // For simplicity, assuming fileData is always text-based for translation, or we'd need a separate parser.
      // In a real-world scenario, you might need to: a) parse PDF/DOCX, b) handle image-to-text (OCR).
      // For now, if it's base64, we assume it's directly translatable text content or a simple file type.
      try {
        textToTranslate = Buffer.from(fileData, 'base64').toString('utf8');
        this.logger.debug(
          `Translating content from file (MIME: ${fileMimeType}, length: ${textToTranslate.length})`,
        );
      } catch (error) {
        this.logger.error(`Failed to decode base64 file data: ${error.message}`);
        throw new HttpException('Failed to decode base64 file data.', HttpStatus.BAD_REQUEST);
      }
    } else {
      textToTranslate = content!;
      this.logger.debug(`Translating provided text content (length: ${textToTranslate.length})`);
    }

    if (!textToTranslate.trim()) {
      throw new HttpException('Content to translate cannot be empty.', HttpStatus.BAD_REQUEST);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
      });

      const requestBody = {
        q: textToTranslate,
        target: targetLanguage,
        format: 'text', // Assuming text format for translation request
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}?${params.toString()}`, requestBody),
      );

      if (response.data && response.data.data && response.data.data.translations) {
        const translatedText = response.data.data.translations[0].translatedText;
        this.logger.log(`Translation successful to ${targetLanguage}.`);
        // If returnInOriginalFormat is true and it was a file, we might need to re-encode
        // or reconstruct the file. This is a complex task and usually requires specific parsers/generators.
        // For now, we return plain text translation.
        if (returnInOriginalFormat && fileData) {
          // Placeholder for complex logic: e.g., if original was a markdown file, try to return markdown
          // For this implementation, we simply return the translated text.
          this.logger.warn(
            '`returnInOriginalFormat` is not fully supported for file-based translations without advanced parsing/reconstruction logic. Returning plain translated text.',
          );
        }
        return translatedText;
      } else {
        this.logger.error('Invalid response structure from Google Translate API:', response.data);
        throw new HttpException(
          'Invalid response from Google Translate API.',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } catch (error) {
      this.logger.error(`Error during translation: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to translate content: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
