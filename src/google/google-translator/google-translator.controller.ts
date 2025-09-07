import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoogleTranslatorService } from './google-translator.service';
import { TranslateContentDto } from './dto/translate-content.dto';

@ApiTags('Google Translator')
@Controller('api/google-translator')
export class GoogleTranslatorController {
  constructor(private readonly googleTranslatorService: GoogleTranslatorService) {}

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Translate text or file content to a target language using Google Cloud Translation API',
    description:
      'Accepts either a plain text string or base64-encoded file content, along with a target language code, and returns the translated text.',
  })
  @ApiBody({
    type: TranslateContentDto,
    examples: {
      textExample: {
        summary: 'Translate plain text',
        value: { content: 'Hello, how are you?', targetLanguage: 'es' },
      },
      fileExample: {
        summary: 'Translate content from a text file (base64 encoded)',
        value: {
          fileData: Buffer.from('The quick brown fox jumps over the lazy dog.').toString('base64'),
          fileName: 'example.txt',
          fileMimeType: 'text/plain',
          targetLanguage: 'fr',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Content translated successfully.',
    type: String,
    example: 'Hola, ¿cómo estás?',
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input or missing content.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error: API key missing or configuration issue.',
  })
  @ApiResponse({ status: 502, description: 'Bad Gateway: Google Translation API request failed.' })
  async translate(@Body() dto: TranslateContentDto): Promise<string> {
    return this.googleTranslatorService.translateContent(dto);
  }
}
