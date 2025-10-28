import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { RecordingService } from './recording.service';
import {
  CreateRecordingDto,
  PaginationRecordingResultDto,
  PaginationRecordingQueryDto,
  StartRecordingDto,
  ScreenshotDto,
  ScreenshotResponseDto, // Import new DTOs
} from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { StartRecordingResponseDto } from './dto/start-recording-response.dto';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { join } from 'path';
import { stat, readdir, unlink } from 'fs/promises';
import {
  StartCameraRecordingDto,
  CameraRecordingResponseDto,
} from '../ffmpeg/dto/camera-recording.dto';

class StopRecordingResponse {
  id: string;
  status: string;
  path: string;
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Recording')
@Controller('api/recording')
export class RecordingController {
  constructor(
    private readonly recordingService: RecordingService,
    private readonly ffmpegService: FfmpegService,
  ) {}

  @Get('status')
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Recording ID to check',
  })
  @ApiOperation({ summary: 'Get current recording status.' })
  @ApiOkResponse({
    description: 'Current recording status.',
    schema: {
      example: {
        recording: true,
        file: '/path/to/file.mp4',
        startedAt: '2025-06-21T06:00:00.000Z',
        id: 'some-uuid-id-of-recording',
      },
    },
  })
  async recordingStatus(
    @CurrentUser('id') userId: string,
    @Query('id') id: string,
  ): Promise<{
    id: string;
    recording: boolean;
    file: string | null;
    startedAt: string | null;
  }> {
    return this.recordingService.getRecordingStatus(userId, id);
  }

  @Get('metadata')
  @ApiOperation({ summary: 'Get metadata for a recording file.' })
  @ApiQuery({
    name: 'file',
    required: true,
    description: 'Full path or filename',
  })
  async getMetadata(
    @CurrentUser('id') userId: string,
    @Query('file') file: string,
  ): Promise<{
    size: number;
    modified: string;
  }> {
    return this.recordingService.getMetadata(userId, file);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all saved recording files on disk.' })
  async listRecordings(@CurrentUser('id') userId: string): Promise<string[]> {
    return this.recordingService.listRecordings(userId);
  }

  @Delete('recordings/cleanup')
  @ApiOperation({ summary: 'Delete recordings older than N days.' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  async cleanupOld(
    @CurrentUser('id') userId: string,
    @Query('days') days = 7,
  ): Promise<{ deleted: string[] }> {
    return this.recordingService.cleanupOld(userId, days);
  }

  @Post('record-start')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Start screen recording with optional audio.' })
  @ApiOkResponse({
    description: 'Recording started.',
    type: StartRecordingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input.' })
  async start(
    @CurrentUser('id') userId: string,
    @Body() dto: StartRecordingDto,
  ): Promise<StartRecordingResponseDto> {
    return this.recordingService.startRecording(userId, dto);
  }

  @Post('record-stop')
  @ApiOperation({ summary: 'Stop screen recording.' })
  @ApiQuery({ name: 'id', required: true, description: 'Recording ID to stop' })
  @ApiOkResponse({
    description: 'Recording stopped successfully.',
    type: StopRecordingResponse,
  })
  async stop(
    @CurrentUser('id') userId: string,
    @Query('id') id: string,
  ): Promise<StopRecordingResponse> {
    if (!id) {
      throw new BadRequestException('Recording ID is required.');
    }
    return this.recordingService.stopRecording(userId, id);
  }

  @Post('screenshot')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Capture a screenshot of the desktop window screen.' })
  @ApiCreatedResponse({
    description: 'Screenshot captured and saved successfully.',
    type: ScreenshotResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or screenshot failed.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to capture screenshot.',
  })
  async captureScreenshot(
    @CurrentUser('id') userId: string,
    @Body() dto: ScreenshotDto,
  ): Promise<ScreenshotResponseDto> {
    return this.recordingService.captureScreenshot(userId, dto);
  }

  @Post('camera-record-start')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Start camera recording.',
    description:
      'Initiates a camera recording session. Specify camera device, resolution, and FPS. Records indefinitely until stopped or for a specified duration.',
  })
  @ApiCreatedResponse({
    description: 'Camera recording started successfully.',
    type: CameraRecordingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid recording parameters.' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to start camera recording.',
  })
  async startCameraRecording(
    @CurrentUser('id') userId: string,
    @Body() dto: StartCameraRecordingDto,
  ): Promise<CameraRecordingResponseDto> {
    return this.recordingService.startCameraRecording(userId, dto);
  }

  @Post('camera-record-stop')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Stop camera recording.',
    description:
      'Stops an active camera recording session identified by its ID.',
  })
  @ApiOkResponse({
    description: 'Camera recording stopped successfully.',
    type: CameraRecordingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Recording ID is required or no active recording found.',
  })
  @ApiNotFoundResponse({ description: 'Recording not found.' })
  async stopCameraRecording(
    @CurrentUser('id') userId: string,
    @Query('id') id: string,
  ): Promise<CameraRecordingResponseDto> {
    if (!id) {
      throw new BadRequestException('Recording ID is required.');
    }
    return this.recordingService.stopCameraRecording(userId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new recording entry.' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateRecordingDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRecordingDto) {
    return this.recordingService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all recordings.' })
  @ApiOkResponse({
    description: 'List of recordings.',
    type: [CreateRecordingDto],
  })
  findAll(@CurrentUser('id') userId: string) {
    return this.recordingService.findAll(userId);
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Paginated recordings.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Paginated results.',
    type: PaginationRecordingResultDto,
  })
  findAllPaginated(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationRecordingQueryDto,
  ) {
    return this.recordingService.findAllPaginated(
      { createdById: userId }, // Filter by current user's recordings
      query.page,
      query.pageSize,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find recording by ID.' })
  @ApiOkResponse({ description: 'Record found.', type: CreateRecordingDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recordingService.findOne(id, userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update recording by ID.' })
  @ApiOkResponse({
    description: 'Successfully updated.',
    type: UpdateRecordingDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecordingDto,
  ) {
    return this.recordingService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete recording by ID.' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recordingService.remove(id, userId);
  }
}
