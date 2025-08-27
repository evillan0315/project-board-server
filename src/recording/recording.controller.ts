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

import { RecordingService } from './recording.service';
import {
  CreateRecordingDto,
  PaginationRecordingResultDto,
  PaginationRecordingQueryDto,
} from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { StartRecordingDto } from './dto/start-recording.dto';
import { StartRecordingResponseDto } from './dto/start-recording-response.dto';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { join } from 'path';
import { stat, readdir, unlink } from 'fs/promises';

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
  constructor(private readonly recordingService: RecordingService,private readonly ffmpegService: FfmpegService) {}

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
  async recordingStatus(@Query('id') id: string): Promise<{
    id: string;
    recording: boolean;
    file: string | null;
    startedAt: string | null;
  }> {
    return this.recordingService.getRecordingStatus(id);
  }

  @Get('metadata')
  @ApiOperation({ summary: 'Get metadata for a recording file.' })
  @ApiQuery({
    name: 'file',
    required: true,
    description: 'Full path or filename',
  })
  async getMetadata(
    @Query('file') file: string,
  ): Promise<{ size: number; modified: string }> {
    const filePath = file.includes('/')
      ? file
      : join(process.cwd(), 'downloads', 'recordings', file);
    const stats = await stat(filePath);
    return { size: stats.size, modified: stats.mtime.toISOString() };
  }

  @Get('list')
  @ApiOperation({ summary: 'List all saved recording files on disk.' })
  async listRecordings(): Promise<string[]> {
    const dir = join(process.cwd(), 'downloads', 'recordings');
    const files = await readdir(dir);
    return files.map((f) => join(dir, f));
  }

  @Delete('recordings/cleanup')
  @ApiOperation({ summary: 'Delete recordings older than N days.' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  async cleanupOld(@Query('days') days = 7): Promise<{ deleted: string[] }> {
    const dir = join(process.cwd(), 'downloads', 'recordings');
    const files = await readdir(dir);
    const now = Date.now();
    const deleted: string[] = [];

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await stat(filePath);
      if (now - stats.mtimeMs > days * 24 * 60 * 60 * 1000) {
        await unlink(filePath);
        deleted.push(filePath);
      }
    }

    return { deleted };
  }

  @Post('capture')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Take a screenshot of the current screen.' })
  @ApiOkResponse({
    description: 'Screen captured.',
    type: StopRecordingResponse,
  })
  async capture(): Promise<StopRecordingResponse> {
    return this.recordingService.captureScreen();
  }

  @Post('record-start')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Start screen recording.' })
  @ApiOkResponse({
    description: 'Recording started.',
    type: StartRecordingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input.' })
  async start(): Promise<StartRecordingResponseDto> {
    return this.recordingService.startRecording();
  }

  @Post('record-stop')
  @ApiOperation({ summary: 'Stop screen recording.' })
  @ApiQuery({ name: 'id', required: true, description: 'Recording ID to stop' })
  @ApiOkResponse({
    description: 'Recording stopped successfully.',
    type: StopRecordingResponse,
  })
  async stop(@Query('id') id: string): Promise<StopRecordingResponse> {
    if (!id) {
      throw new BadRequestException('Recording ID is required.');
    }
    return this.recordingService.stopRecording(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new recording entry.' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateRecordingDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  create(@Body() dto: CreateRecordingDto) {
    return this.recordingService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all recordings.' })
  @ApiOkResponse({
    description: 'List of recordings.',
    type: [CreateRecordingDto],
  })
  findAll() {
    return this.recordingService.findAll();
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
  findAllPaginated(@Query() query: PaginationRecordingQueryDto) {
    return this.recordingService.findAllPaginated(
      undefined,
      query.page,
      query.pageSize,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find recording by ID.' })
  @ApiOkResponse({ description: 'Record found.', type: CreateRecordingDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  findOne(@Param('id') id: string) {
    return this.recordingService.findOne(id);
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
  update(@Param('id') id: string, @Body() dto: UpdateRecordingDto) {
    return this.recordingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete recording by ID.' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  remove(@Param('id') id: string) {
    return this.recordingService.remove(id);
  }
}
