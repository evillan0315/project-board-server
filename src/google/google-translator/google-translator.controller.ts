import { Controller, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
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
      'Translate text or file content to a target language using Google Cloud Translation API.',
    description:
      'Provide either `content` for text translation or `fileData`, `fileName`, and `fileMimeType` for file translation. The target language is required.',
  })
  @ApiBody({ type: TranslateContentDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully translated content.',
    type: String,
    example: 'Hola, ¿cómo estás?',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input or missing required fields.',
  })
  @ApiResponse({
    status: 502,
    description: 'Bad Gateway - Google Cloud Translation API request failed.',
  })
  async translate(@Body() dto: TranslateContentDto): Promise<string> {
    if (!dto.content && !dto.fileData) {
      throw new HttpException(
        'Either content or fileData must be provided for translation.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.fileData && (!dto.fileName || !dto.fileMimeType)) {
      throw new HttpException(
        'fileName and fileMimeType are required when fileData is provided.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.googleTranslatorService.translateContent(dto);
  }
}
