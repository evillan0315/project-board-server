import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Request } from 'express';
import {
  CreateMediaDto,
  MediaFileResponseDto,
  UpdateMediaDto,
  PaginationMediaQueryDto,
  PaginationMediaResultDto,
} from './dto';
import { FileType } from '@prisma/client';

@ApiTags('Media')
@ApiBearerAuth()
@ApiSecurity('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('extract')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Extract audio/video from a URL',
    description: 'Requires authentication with ADMIN or USER role.',
  })
  @ApiBody({ type: CreateMediaDto })
  @ApiResponse({
    status: 200,
    description: 'Returns the extracted audio/video file details.',
    type: MediaFileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles' })
  @ApiBadRequestResponse({ description: 'Invalid URL or format.' })
  async extract(@Req() req: Request, @Body() body: CreateMediaDto): Promise<MediaFileResponseDto> {
    const { url, provider, cookieAccess = false, format = 'webm' } = body;

    if (!url) {
      throw new BadRequestException('The URL is required.');
    }

    const allowedFormats = ['mp3', 'webm', 'm4a', 'wav', 'mp4', 'flv'] as const;
    type Format = (typeof allowedFormats)[number];

    const isValidFormat = (f: string): f is Format => allowedFormats.includes(f as Format);

    const selectedFormat = isValidFormat(format) ? format : 'webm';

    const file = await this.mediaService.extractAudioVideoFromYoutube(
      url,
      selectedFormat,
      undefined, // Progress callback (optional)
      undefined, // File path callback (optional)
      provider,
      cookieAccess,
    );

    // Convert BigInt to string for JSON serialization
    const response: MediaFileResponseDto = {
      ...file,
      size: file.size ? file.size.toString() : undefined,
    };
    return response;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Retrieve all media files uploaded by the user, with optional pagination and filters.',
  })
  @ApiOkResponse({ type: PaginationMediaResultDto, description: 'Paginated list of media files.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles.' })
  async findAllPaginated(
    @Query() query: PaginationMediaQueryDto,
  ): Promise<PaginationMediaResultDto> {
    const result = await this.mediaService.findAllPaginated(query);
    // Convert BigInt to string for each file's size property in the items array
    const itemsWithFormattedSize = result.items.map((file) => ({
      ...file,
      size: file.size ? file.size.toString() : undefined,
    }));

    return {
      ...result,
      items: itemsWithFormattedSize,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Find a media file by ID.' })
  @ApiOkResponse({ type: MediaFileResponseDto, description: 'Media file found.' })
  @ApiNotFoundResponse({ description: 'Media file not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles.' })
  async findOne(@Param('id') id: string): Promise<MediaFileResponseDto> {
    const file = await this.mediaService.findOne(id);
    if (!file) {
      throw new NotFoundException(`Media file with ID ${id} not found.`);
    }
    // Convert BigInt to string for JSON serialization
    return {
      ...file,
      size: file.size ? file.size.toString() : undefined,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Delete a media file by ID.' })
  @ApiOkResponse({ description: 'Successfully deleted the media file.' })
  @ApiNotFoundResponse({ description: 'Media file not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles.' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.mediaService.remove(id);
    return { message: `Media file with ID ${id} deleted successfully.` };
  }
}
