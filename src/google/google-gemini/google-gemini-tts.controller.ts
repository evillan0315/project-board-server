import {
  Controller,
  Post,
  Body,
  HttpCode,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { GoogleGeminiTtsService } from './google-gemini-tts.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

class SpeakerDto {
  @ApiProperty({
    example: 'Eddie',
    description: 'Speaker name as referenced in the prompt',
  })
  speaker: string;

  @ApiProperty({
    example: 'Kore',
    description: 'Voice name to use for the speaker',
  })
  voiceName: string;
}

export class TtsRequestDto {
  @ApiProperty({
    example: `Eddie: AI is changing everything!\nMarionette: And it's influencing fashion too.`,
    description: 'Text prompt with named speakers',
  })
  prompt: string;

  @ApiProperty({
    type: [SpeakerDto],
    description: 'Array of speaker-voice configurations',
    example: [
      { speaker: 'Eddie', voiceName: 'Kore' },
      { speaker: 'Marionette', voiceName: 'Puck' },
    ],
  })
  speakers: SpeakerDto[];

  @ApiProperty({
    example: 'en-US',
    description: 'Language code for the speech synthesis (optional)',
    required: false,
  })
  languageCode?: string;
}

@ApiTags('Google Gemini')
@Controller('api/google-tts')
export class GoogleGeminiTtsController {
  constructor(private readonly ttsService: GoogleGeminiTtsService) {}

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Generate TTS audio with multiple speakers using Google Gemini',
  })
  @ApiBody({ type: TtsRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Returns the generated WAV audio file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async generateAudio(
    @Body() body: TtsRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    // generateSpeech now returns an absolute path
    const filePath = await this.ttsService.generateSpeech(
      body.prompt,
      body.speakers,
      body.languageCode,
    );
    console.log(filePath, 'filePath');
    // Defensive check to ensure file exists before streaming
    if (!fs.existsSync(filePath)) {
      throw new HttpException('Audio file not found', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(filePath)}"`,
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
