import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AudioService } from './audio.service';

@ApiTags('Audio')
@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract audio/video from a URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=xyz',
        },
        format: {
          type: 'string',
          enum: ['mp3', 'webm', 'm4a', 'wav', 'mp4', 'flv'],
          default: 'mp3',
        },
        provider: {
          type: 'string',
          example: 'youtube',
          description: 'Source provider such as youtube, vimeo, udemy, etc.',
        },
        cookieAccess: {
          type: 'boolean',
          default: false,
          description:
            'Whether to include authentication cookies for private content.',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the extracted audio/video file path.',
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
      },
    },
  })
  async extract(
    @Body()
    body: {
      url: string;
      provider?: string;
      cookieAccess?: boolean;
      format?: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv';
    },
  ): Promise<{ filePath: string }> {
    const { url, provider, cookieAccess = false, format = 'mp3' } = body;

    if (!url) {
      throw new BadRequestException('The URL is required.');
    }

    const allowedFormats = ['mp3', 'webm', 'm4a', 'wav', 'mp4', 'flv'] as const;
    type Format = (typeof allowedFormats)[number];

    const isValidFormat = (f: string): f is Format =>
      allowedFormats.includes(f as Format);

    const selectedFormat = isValidFormat(format) ? format : 'webm';

    const filePath = await this.audioService.extractAudioVideoFromYoutube(
      url,
      selectedFormat,
      undefined, // Progress callback (optional)
      undefined, // File path callback (optional)
      provider,
      cookieAccess,
    );

    return { filePath };
  }
}
