import { Controller, Post, Body, BadRequestException, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Request } from 'express';

@ApiTags('Media')
@ApiBearerAuth()
@ApiSecurity('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('extract')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Extract audio/video from a URL',
    description: 'Requires authentication with ADMIN or USER role.',
  })
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
          description: 'Whether to include authentication cookies for private content.',
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
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles' })
  async extract(
    @Req() req: Request,
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

    const isValidFormat = (f: string): f is Format => allowedFormats.includes(f as Format);

    const selectedFormat = isValidFormat(format) ? format : 'webm';

    const filePath = await this.mediaService.extractAudioVideoFromYoutube(
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
