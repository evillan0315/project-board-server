import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  Get,
  Query,
  NotFoundException,
  Param,
  Delete,
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
import { TranscriptionService } from './transcription.service';
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
  MediaScanRequestDto,
  MediaScanResponseDto,
  TranscriptionResultDto,
  SyncTranscriptionRequestDto,
  SyncTranscriptionResponseDto,
} from './dto';
import { FileType } from '@prisma/client';

@ApiTags('Media')
@ApiBearerAuth()
@ApiSecurity('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly transcriptionService: TranscriptionService,
  ) {}

  @Post(':id/transcribe')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Transcribe an audio file',
    description:
      'Transcribes an audio file using speech-to-text and saves the transcription with timestamps.',
  })
  @ApiOkResponse({
    description: 'Transcription completed successfully',
    type: TranscriptionResultDto,
  })
  @ApiNotFoundResponse({ description: 'Media file not found.' })
  @ApiBadRequestResponse({
    description: 'File is not an audio file or transcription failed.',
  })
  async transcribeAudio(
    @Param('id') id: string,
  ): Promise<TranscriptionResultDto> {
    // Get file from database
    const file = await this.mediaService.findOne(id);

    if (!file) {
      throw new NotFoundException(`Media file with ID ${id} not found.`);
    }

    if (file.fileType !== FileType.AUDIO) {
      throw new BadRequestException('File is not an audio file');
    }

    try {
      // Transcribe audio
      const transcription = await this.transcriptionService.transcribeAudio(
        file.path,
      );

      // Save transcription to database
      await this.transcriptionService.saveTranscription(id, transcription);

      return transcription;
    } catch (error) {
      throw new BadRequestException(`Transcription failed: ${error.message}`);
    }
  }

  @Get(':id/transcription')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Get transcription for a media file',
    description: 'Retrieves the transcription for an audio file if it exists.',
  })
  @ApiOkResponse({
    description: 'Transcription found',
    type: TranscriptionResultDto,
  })
  @ApiNotFoundResponse({ description: 'Transcription not found.' })
  async getTranscription(
    @Param('id') id: string,
  ): Promise<TranscriptionResultDto> {
    const transcription = await this.transcriptionService.getTranscription(id);

    if (!transcription) {
      throw new NotFoundException(`Transcription not found for file ID ${id}`);
    }

    return transcription;
  }

  @Post(':id/transcription/sync')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Get synchronized transcription data',
    description:
      'Returns transcription segments synchronized with current playback time for highlighting.',
  })
  @ApiBody({ type: SyncTranscriptionRequestDto })
  @ApiOkResponse({
    description: 'Synchronized transcription data',
    type: SyncTranscriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Transcription not found.' })
  async getSynchronizedTranscription(
    @Param('id') id: string,
    @Body() syncRequest: SyncTranscriptionRequestDto,
  ): Promise<SyncTranscriptionResponseDto> {
    const transcription = await this.transcriptionService.getTranscription(id);

    if (!transcription) {
      throw new NotFoundException(`Transcription not found for file ID ${id}`);
    }

    const syncData = this.transcriptionService.getCurrentSegment(
      transcription,
      syncRequest.currentTime,
    );

    return {
      ...syncData,
      fullTranscription: transcription,
    };
  }

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
  async extract(
    @Req() req: Request,
    @Body() body: CreateMediaDto,
  ): Promise<MediaFileResponseDto> {
    const { url, provider, cookieAccess = false, format = 'webm' } = body;

    if (!url) {
      throw new BadRequestException('The URL is required.');
    }

    const allowedFormats = ['mp3', 'webm', 'm4a', 'wav', 'mp4', 'flv'] as const;
    type Format = (typeof allowedFormats)[number];

    const isValidFormat = (f: string): f is Format =>
      allowedFormats.includes(f as Format);

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

  @Post('scan-directory')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary:
      'Scans a specified directory for media files and adds them to the database.',
    description:
      'Requires authentication with ADMIN or USER role. Scans the provided directory recursively for supported media file types (audio, video, image) and creates database entries for new files. Prevents scanning of sensitive system directories.',
  })
  @ApiBody({ type: MediaScanRequestDto })
  @ApiCreatedResponse({
    description:
      'Returns the result of the directory scan, including count of new files and any errors.',
    type: MediaScanResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient roles' })
  @ApiBadRequestResponse({
    description:
      'Invalid directory path or scanning of this directory is not allowed.',
  })
  async scanDirectory(
    @Body() requestDto: MediaScanRequestDto,
  ): Promise<MediaScanResponseDto> {
    return this.mediaService.scanDirectoryForMedia(requestDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary:
      'Retrieve all media files uploaded by the user, with optional pagination and filters.',
  })
  @ApiOkResponse({
    type: PaginationMediaResultDto,
    description: 'Paginated list of media files.',
  })
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
  @ApiOkResponse({
    type: MediaFileResponseDto,
    description: 'Media file found.',
  })
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
