import {
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  spawn,
  ChildProcessWithoutNullStreams,
  spawnSync,
} from 'child_process';
import { join, dirname } from 'path';
import { stat, unlink, mkdir, readdir } from 'fs/promises';

import { PrismaService } from '../prisma/prisma.service';
import { TerminalService } from '../terminal/terminal.service';
import {
  CreateRecordingDto,
  StartRecordingDto, // Import the StartRecordingDto for screen recording options
  ScreenshotDto,
  ScreenshotResponseDto, // Import new DTOs
} from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { StartRecordingResponseDto } from './dto/start-recording-response.dto';
import { Prisma, Recording } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import {
  StartCameraRecordingDto,
  CameraRecordingResponseDto,
} from '../ffmpeg/dto/camera-recording.dto';
import sharp from 'sharp'; // Import sharp

// --- Start of new/modified types ---
interface ActiveRecording {
  id: string;
  process: ChildProcessWithoutNullStreams;
  outputPath: string;
  startTime: number;
  stopTimer: NodeJS.Timeout | null;
}

// Interface for the 'data' JSON field in the Recording model
interface RecordingData {
  startedAt?: string;
  stoppedAt?: string;
  duration?: number;
  fileSize?: number;
  exitCode?: number;
  cameraDevice?: string;
  resolution?: string;
  fps?: number;
  capturedAt?: string; // New field for screenshot capture time
  format?: string; // New field for screenshot format (e.g., 'jpeg', 'png')
  enableAudio?: boolean; // New field
  audioDevice?: string; // New field
  // Add other potential properties from the `data` JSON field
  [key: string]: Prisma.InputJsonValue | undefined; // Add index signature for compatibility with Prisma's Json type
}
// --- End of new/modified types ---

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private activeRecordings: Map<string, ActiveRecording> = new Map();
  constructor(
    private prisma: PrismaService,
    private terminal: TerminalService,
    private ffmpegService: FfmpegService,
  ) {}

  /**
   * Returns the current recording status for a given user and optional recording ID.
   */
  async getRecordingStatus(
    userId: string,
    id?: string,
  ):
    Promise<{
      id: string;
      recording: boolean;
      file: string | null;
      startedAt: string | null;
    }> {
    let recordingEntity: Recording | null = null;

    if (id) {
      // If an ID is provided, check that specific recording for the current user
      recordingEntity = await this.prisma.recording.findFirst({
        where: { id: id, createdById: userId },
      });
    } else {
      // If no ID, find any active recording for the current user
      recordingEntity = await this.prisma.recording.findFirst({
        where: { createdById: userId, status: 'recording' },
        orderBy: { createdAt: 'desc' }, // Get the most recent one if multiple active (shouldn't happen)
      });
    }

    if (!recordingEntity) {
      return {
        id: '',
        recording: false,
        file: null,
        startedAt: null,
      };
    }

    // Check if the process is actually still running in-memory
    const activeRecord = this.activeRecordings.get(recordingEntity.id);
    const isRunning = activeRecord && activeRecord.process.pid && !activeRecord.process.killed;

    return {
      id: recordingEntity.id,
      recording: !!isRunning, // Explicitly cast to boolean
      file: recordingEntity.path,
      startedAt: isRunning
        ? new Date(activeRecord.startTime).toISOString()
        : (recordingEntity.data as RecordingData)?.startedAt?.toString() || null,
    };
  }

  /**
   * Retrieves metadata of a recording file for a specific user.
   * @param userId The ID of the user.
   * @param file Path or filename
   */
  async getMetadata(
    userId: string,
    file: string,
  ):
    Promise<{
      size: number;
      modified: string;
    }> {
    // Ensure the file is within the user's directory for security
    const baseDir = join(process.cwd(), 'downloads', 'recordings', userId);
    const filePath = file.includes('/') ? file : join(baseDir, file);

    // Basic path traversal prevention
    if (!filePath.startsWith(baseDir)) {
      throw new ForbiddenException('Access to specified file path is denied.');
    }

    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime.toISOString(),
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File not found: ${file}`);
      }
      this.logger.error(`Error getting metadata for ${filePath}: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to retrieve file metadata: ${error.message}`,
      );
    }
  }

  /**
   * Lists all recording files for a specific user.
   * @param userId The ID of the user.
   */
  async listRecordings(userId: string): Promise<string[]> {
    const dir = join(process.cwd(), 'downloads', 'recordings', userId);
    try {
      await mkdir(dir, { recursive: true }); // Ensure directory exists
      const files = await readdir(dir);
      return files.map((f) => join('downloads', 'recordings', userId, f)); // Return relative paths or just filenames
    } catch (error) {
      this.logger.error(
        `Error listing recordings for user ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to list recordings.');
    }
  }

  /**
   * Deletes recordings older than N days for a specific user.
   * @param userId The ID of the user.
   * @param days Number of days to use as threshold
   */
  async cleanupOld(
    userId: string,
    days: number = 7,
  ):
    Promise<{ deleted: string[] }> {
    const dir = join(process.cwd(), 'downloads', 'recordings', userId);
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

  create(data: CreateRecordingDto) {
    const createData: any = { ...data };
    // 'createdById' will already be present from DTO if provided directly, otherwise handle it.
    // In this context, 'createdById' is expected to be provided by the authenticated user in the controller, if not, it should be set.
    return this.prisma.recording.create({ data: createData });
  }

  async findAllPaginated(
    where: Prisma.RecordingWhereInput = {},
    page = 1,
    pageSize = 10,
    select?: Prisma.RecordingSelect,
  ) {
    const skip = (page - 1) * pageSize;
    const take = Number(pageSize);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recording.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.recording.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findAll(userId: string) {
    return this.prisma.recording.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const recording = await this.prisma.recording.findUnique({ where: { id } });

    if (!recording || recording.createdById !== userId) {
      throw new NotFoundException(
        `Recording with ID ${id} not found for user ${userId}.`,
      );
    }
    return recording;
  }

  async update(id: string, data: UpdateRecordingDto, userId: string) {
    // Ensure the user owns the recording
    await this.findOne(id, userId);
    return this.prisma.recording.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const recording = await this.findOne(id, userId);

    try {
      await unlink(recording.path);
      this.logger.log(`Deleted file: ${recording.path}`);
    } catch (err) {
      this.logger.warn(
        `Failed to delete file: ${recording.path}. Error: ${err.message}`,
      );
      // Continue with database deletion even if file deletion fails, as the database entry is the primary source of truth.
    }

    return this.prisma.recording.delete({ where: { id } });
  }

  async startRecording(
    userId: string,
    dto: StartRecordingDto, // Accept DTO with audio options
  ): Promise<StartRecordingResponseDto> {
    const outputFile = join(
      process.cwd(),
      'downloads',
      'recordings',
      userId,
      `recorded-${Date.now()}.mp4`,
    );

    const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
    if (ffmpegCheck.error) {
      throw new InternalServerErrorException(
        'FFmpeg is not installed or not in PATH.',
      );
    }
    await mkdir(dirname(outputFile), { recursive: true });

    const ffmpegArgs = this._getScreenRecordingFfmpegArgs(
      outputFile,
      dto.enableAudio || false,
      dto.audioDevice,
    );
    this.logger.log(`Starting screen recording: ${outputFile} with args: ${ffmpegArgs.join(' ')}`);

    const recordingProcess = spawn('ffmpeg', ffmpegArgs);

    if (!recordingProcess?.pid) {
      throw new InternalServerErrorException(
        'Failed to start screen recording process.',
      );
    }

    const pid = String(recordingProcess.pid);
    const startTime = Date.now();
    const startedAtISO = new Date(startTime).toISOString();

    const recording = await this.prisma.recording.create({
      data: {
        path: outputFile,
        type: 'screenRecord',
        status: 'recording',
        pid: pid,
        data: {
          startedAt: startedAtISO,
          enableAudio: dto.enableAudio || false,
          audioDevice: dto.audioDevice || null,
        } as RecordingData,
        createdBy: { connect: { id: userId } },
      },
    });

    recordingProcess.stderr.on('data', (ffmpegData) => {
      this.logger.debug(`ffmpeg (screen): ${ffmpegData}`);
    });

    const stopTimer = setTimeout(() => {
      this.logger.log(
        `Auto-stopping screen recording ${recording.id} after 2 hours limit.`,
      );
      this.stopRecording(userId, recording.id);
    }, 7200 * 1000); // 2 hours

    this.activeRecordings.set(recording.id, {
      id: recording.id,
      process: recordingProcess,
      outputPath: outputFile,
      startTime: startTime,
      stopTimer: stopTimer,
    });

    recordingProcess.once('exit', async (code) => {
      this.logger.log(
        `Screen recording process ${recording.id} exited with code ${code}`,
      );
      this._handleRecordingExit(userId, recording.id, code, outputFile);
    });

    return { path: outputFile, id: recording.id };
  }

  async stopRecording(
    userId: string,
    id: string,
  ):
    Promise<{
    id: string;
    status: string;
    path: string;
  }> {
    const activeRecord = this.activeRecordings.get(id);

    if (!activeRecord) {
      const dbRecording = await this.prisma.recording.findUnique({
        where: { id, createdById: userId },
      });
      if (!dbRecording) {
        throw new BadRequestException(
          `No active or saved recording found with ID: ${id}.`,
        );
      }
      // If it's in DB but not active, means it already stopped or was manually killed.
      return {
        id: dbRecording.id,
        status: dbRecording.status,
        path: dbRecording.path,
      };
    }

    if (activeRecord.process && !activeRecord.process.killed) {
      this.logger.log(
        `Sending SIGINT to screen recording process PID: ${activeRecord.process.pid} for ID: ${id}`,
      );
      activeRecord.process.kill('SIGINT'); // Send interrupt signal to ffmpeg
    }

    // The 'exit' event handler (_handleRecordingExit) will be responsible for clearing the timer
    // and removing the recording from activeRecordings map once the process fully exits.
    // We do not delete from the map here to ensure _handleRecordingExit has access to activeRecord data.

    const updatedRecording = await this.prisma.recording.findUnique({
      where: { id, createdById: userId },
    });

    if (!updatedRecording) {
      // This should ideally not happen if an activeRecord was found, but for type safety and robustness:
      throw new NotFoundException(`Recording with ID ${id} not found after stopping.`);
    }

    return {
      id: updatedRecording.id,
      path: updatedRecording.path,
      status: updatedRecording.status,
    };
  }

  /**
   * Captures a screenshot of the desktop window screen.
   * @param userId The ID of the user.
   * @param dto Screenshot options (format, quality).
   * @returns A promise that resolves with the screenshot details.
   */
  async captureScreenshot(
    userId: string,
    dto: ScreenshotDto,
  ): Promise<ScreenshotResponseDto> {
    const { format = 'jpeg', quality = 90 } = dto;

    const screenshotsDir = join(
      process.cwd(),
      'downloads',
      'recordings',
      userId,
      'screenshots',
    );
    await mkdir(screenshotsDir, { recursive: true });

    const tempPngPath = join(screenshotsDir, `temp_screenshot_${Date.now()}.png`);
    const outputFileName = `screenshot_${Date.now()}.${format}`;
    const finalOutputPath = join(screenshotsDir, outputFileName);

    const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
    if (ffmpegCheck.error) {
      throw new InternalServerErrorException(
        'FFmpeg is not installed or not in PATH.',
      );
    }

    const ffmpegArgs = this._getScreenshotFfmpegArgs(tempPngPath);
    this.logger.log(
      `Capturing screenshot with command: ffmpeg ${ffmpegArgs.join(' ')}`,
    );

    return new Promise((resolve, reject) => {
      const screenshotProcess = spawn('ffmpeg', ffmpegArgs);
      let stderrOutput = '';

      screenshotProcess.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      screenshotProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(
            `FFmpeg screenshot failed with code ${code}: ${stderrOutput}`,
          );
          // Attempt to clean up the temporary file if it was created before failing
          try { await unlink(tempPngPath); } catch (e) { /* ignore */ }
          return reject(
            new InternalServerErrorException(
              `Failed to capture screenshot: ${stderrOutput}`,
            ),
          );
        }

        try {
          const image = sharp(tempPngPath);
          const metadata = await image.metadata();
          const resolution = `${metadata.width}x${metadata.height}`;

          if (format === 'jpeg') {
            await image.jpeg({ quality }).toFile(finalOutputPath);
          } else if (format === 'png') {
            await image.png().toFile(finalOutputPath);
          } else if (format === 'webp') {
            await image.webp({ quality }).toFile(finalOutputPath);
          } else {
            // Fallback for unknown formats, should not happen with validation
            await image.toFile(finalOutputPath);
          }

          await unlink(tempPngPath); // Clean up temp PNG

          const screenshot = await this.prisma.recording.create({
            data: {
              path: finalOutputPath,
              type: 'screenshot',
              status: 'finished', // Screenshots are instant, so 'finished'
              pid: null, // No long-running process
              data: {
                capturedAt: new Date().toISOString(),
                resolution: resolution,
                format: format,
              } as RecordingData,
              createdBy: { connect: { id: userId } },
            },
          });

          resolve({
            id: screenshot.id,
            path: screenshot.path,
            message: 'Screenshot captured successfully.',
          });
        } catch (err) {
          this.logger.error(
            `Error processing screenshot or saving to DB: ${err.message}`,
            err.stack,
          );
          // Attempt to clean up temp file if conversion failed
          try { await unlink(tempPngPath); } catch (e) { /* ignore */ }
          reject(
            new InternalServerErrorException(
              `Failed to process screenshot: ${err.message}`,
            ),
          );
        }
      });

      screenshotProcess.on('error', (err) => {
        this.logger.error(
          `Failed to spawn FFmpeg for screenshot: ${err.message}`,
          err.stack,
        );
        reject(
          new InternalServerErrorException(
            `Failed to capture screenshot: ${err.message}`,
          ),
        );
      });
    });
  }

  async startCameraRecording(
    userId: string,
    dto: StartCameraRecordingDto,
  ): Promise<CameraRecordingResponseDto> {
    const cameraOutputDir = join(
      process.cwd(),
      'downloads',
      'recordings',
      userId,
      'camera',
    );
    await mkdir(cameraOutputDir, { recursive: true });

    const outputFile = join(
      cameraOutputDir,
      `recorded-camera-${Date.now()}.mp4`,
    );

    const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
    if (ffmpegCheck.error) {
      throw new InternalServerErrorException(
        'FFmpeg is not installed or not in PATH.',
      );
    }

    this.logger.log(
      `Attempting to start camera recording for user ${userId} to ${outputFile}`,
    );

    try {
      const recordingProcess = await this.ffmpegService.startCameraRecording(
        dto.cameraDevice,
        outputFile,
        (progress) => {
          this.logger.debug(
            `Camera Recording Progress for ${userId}: ${progress.time}`,
          );
          // Potentially emit this via WebSocket for real-time client updates
        },
        { resolution: dto.resolution, fps: dto.fps, audioDevice: dto.audioDevice },
      );

      const pid = String(recordingProcess.pid);
      const startTime = Date.now();
      const startedAtISO = new Date(startTime).toISOString();

      const recording = await this.prisma.recording.create({
        data: {
          path: outputFile,
          type: 'cameraRecord',
          status: 'recording',
          pid: pid,
          data: {
            startedAt: startedAtISO,
            cameraDevice: dto.cameraDevice,
            resolution: dto.resolution,
            fps: dto.fps,
            audioDevice: dto.audioDevice,
          } as RecordingData,
          createdBy: { connect: { id: userId } },
        },
      });

      const durationInMs = (dto.duration || 7200) * 1000; // Default to 2 hours if no duration provided
      const stopTimer = setTimeout(() => {
        this.logger.log(
          `Auto-stopping camera recording ${recording.id} after ${durationInMs / 1000} seconds.`,
        );
        this.stopCameraRecording(userId, recording.id);
      }, durationInMs);

      this.activeRecordings.set(recording.id, {
        id: recording.id,
        process: recordingProcess,
        outputPath: outputFile,
        startTime: startTime,
        stopTimer: stopTimer,
      });

      recordingProcess.once('exit', async (code) => {
        this.logger.log(
          `Camera recording process ${recording.id} exited with code ${code}`,
        );
        this._handleRecordingExit(userId, recording.id, code, outputFile);
      });

      return {
        id: recording.id,
        path: recording.path,
        message: 'Camera recording started successfully.',
        pid: pid,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start camera recording for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to start camera recording: ${error.message}`,
      );
    }
  }

  async stopCameraRecording(
    userId: string,
    id: string,
  ): Promise<CameraRecordingResponseDto> {
    const activeRecord = this.activeRecordings.get(id);

    if (!activeRecord) {
      const dbRecording = await this.prisma.recording.findUnique({
        where: { id, createdById: userId },
      });
      if (!dbRecording) {
        throw new BadRequestException(
          `No active or saved camera recording found with ID: ${id}.`,
        );
      }
      return {
        id: dbRecording.id,
        path: dbRecording.path,
        message: 'Camera recording already stopped or never started.',
      };
    }

    if (activeRecord.process && !activeRecord.process.killed) {
      this.logger.log(
        `Sending SIGINT to camera recording process PID: ${activeRecord.process.pid} for ID: ${id}`,
      );
      activeRecord.process.kill('SIGINT'); // Send interrupt signal to ffmpeg
    }

    // The 'exit' event handler (_handleRecordingExit) will be responsible for clearing the timer
    // and removing the recording from activeRecordings map once the process fully exits.
    // We do not delete from the map here to ensure _handleRecordingExit has access to activeRecord data.

    const updatedRecording = await this.prisma.recording.findUnique({
      where: { id, createdById: userId },
    });

    if (!updatedRecording) {
      // This should ideally not happen if an activeRecord was found, but for type safety and robustness:
      throw new NotFoundException(`Recording with ID ${id} not found after stopping.`);
    }

    return {
      id: updatedRecording.id,
      path: updatedRecording.path,
      message: 'Camera recording stopped successfully.',
    };
  }

  private async _handleRecordingExit(
    userId: string,
    recordingId: string,
    exitCode: number | null, // Corrected to handle 'null'
    outputFile: string,
  ) {
    const activeRecord = this.activeRecordings.get(recordingId);

    if (!activeRecord) {
      this.logger.warn(
        `_handleRecordingExit called for non-active recording ${recordingId}. It might have been already handled or manually removed.`,
      );
      // Attempt to update the DB entry if it exists, even if not in active map
      const currentRecording = await this.prisma.recording.findUnique({
        where: { id: recordingId, createdById: userId },
      });
      if (currentRecording) {
        await this.prisma.recording.update({
          where: { id: recordingId },
          data: {
            status: exitCode === 0 || exitCode === 255 ? 'finished' : 'failed',
            data: {
              ...(currentRecording.data as RecordingData || {}),
              stoppedAt: new Date().toISOString(),
              exitCode,
            },
          },
        });
      }
      return; // Exit as there's no active process to manage
    }

    // Clear the timeout associated with this recording
    if (activeRecord.stopTimer) {
      clearTimeout(activeRecord.stopTimer);
      activeRecord.stopTimer = null;
    }

    // Remove the recording from the active map now that its lifecycle is complete.
    this.activeRecordings.delete(recordingId);

    let duration = 0;
    let fileSize = 0;

    try {
      if (activeRecord.startTime !== null) {
        duration = (Date.now() - activeRecord.startTime) / 1000;
      }
      const fileStats = await stat(outputFile);
      fileSize = fileStats.size;
    } catch (err) {
      this.logger.warn(
        `Could not get file stats for ${outputFile} after recording exit: ${err.message}`,
      );
    }

    const currentRecording = await this.prisma.recording.findUnique({
      where: { id: recordingId, createdById: userId },
    });

    if (currentRecording) {
      await this.prisma.recording.update({
        where: { id: recordingId },
        data: {
          status: exitCode === 0 ? 'finished' : 'failed',
          data: {
            ...(currentRecording.data as RecordingData || {}),
            stoppedAt: new Date().toISOString(),
            duration,
            fileSize,
            exitCode,
            resolution: process.env.RESOLUTION || '1920x1080',
          },
        },
      });
      this.logger.log(
        `Recording ${recordingId} metadata updated: status={${
          exitCode === 0 ? 'finished' : 'failed'
        }}, duration=${duration}s, fileSize=${fileSize} bytes`,
      );
    }
  }

  /**
   * Constructs FFmpeg arguments for screen recording with optional audio.
   * @param outputFile The path to the output video file.
   * @param enableAudio Whether to capture audio.
   * @param audioDevice The specific audio device to use (optional).
   * @returns An array of FFmpeg arguments.
   */
  private _getScreenRecordingFfmpegArgs(
    outputFile: string,
    enableAudio: boolean,
    audioDevice: string | undefined,
  ): string[] {
    const platform = process.platform;
    const ffmpegInputArgs: string[] = [];
    const ffmpegOutputArgs: string[] = [
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-b:v', '1M',
      '-r', '30',
      '-movflags', '+faststart',
      '-y', // Overwrite output file if it exists
      outputFile,
    ];

    if (platform === 'darwin') {
      // macOS - Use avfoundation
      // For avfoundation, video device 1 is typically the primary display.
      // Audio device 0 is usually the default microphone.
      if (enableAudio) {
        ffmpegInputArgs.push('-f', 'avfoundation', '-framerate', '30', '-i', `1:${audioDevice || '0'}`);
        ffmpegOutputArgs.unshift('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
      } else {
        ffmpegInputArgs.push('-f', 'avfoundation', '-framerate', '30', '-i', '1'); // Video only
        ffmpegOutputArgs.unshift('-an'); // Disable audio in output
      }
    } else if (platform === 'win32') {
      // Windows - Use gdigrab for screen, dshow for audio
      ffmpegInputArgs.push(
        '-f', 'gdigrab',
        '-framerate', '30',
        '-i', 'desktop',
      );
      if (enableAudio) {
        ffmpegInputArgs.push(
          '-f', 'dshow',
          '-i', `audio=${audioDevice || 'virtual-audio-capturer'}`, // Requires a virtual audio device or specific device name
        );
        ffmpegOutputArgs.unshift('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
      } else {
        ffmpegOutputArgs.unshift('-an'); // Disable audio in output
      }
    } else { // Linux
      try {
        const { execSync } = require('child_process');
        // Attempt to get full screen resolution via xrandr
        const xrandrOutput = execSync('xrandr | grep "\\*" | cut -d" " -f4').toString().trim();
        const fullResolution = xrandrOutput || '1920x1080';
        const display = process.env.DISPLAY || ':0.0';

        ffmpegInputArgs.push(
          '-video_size', fullResolution,
          '-framerate', '30',
          '-f', 'x11grab',
          '-i', `${display}`,
        );
        if (enableAudio) {
          ffmpegInputArgs.push('-f', 'pulse', '-i', audioDevice || 'default');
          ffmpegOutputArgs.unshift('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
        } else {
          ffmpegOutputArgs.unshift('-an');
        }
      } catch (e) {
        this.logger.warn(`Failed to detect display resolution with xrandr: ${e.message}. Using default.`);
        // Fallback for Linux if xrandr fails or is not available
        ffmpegInputArgs.push(
          '-f', 'x11grab',
          '-framerate', '30',
          '-i', ':0.0', // Default display
        );
        if (enableAudio) {
          ffmpegInputArgs.push('-f', 'pulse', '-i', audioDevice || 'default');
          ffmpegOutputArgs.unshift('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
        } else {
          ffmpegOutputArgs.unshift('-an');
        }
      }
    }
    return [...ffmpegInputArgs, ...ffmpegOutputArgs];
  }

  /**
   * Constructs FFmpeg arguments for capturing a single screenshot.
   * @param outputFile The path to the output image file (e.g., .png).
   * @returns An array of FFmpeg arguments.
   */
  private _getScreenshotFfmpegArgs(outputFile: string): string[] {
    const platform = process.platform;
    const ffmpegArgs: string[] = [];

    if (platform === 'darwin') {
      // macOS - Use avfoundation for screen capture. Display '1' usually refers to the main screen.
      // It captures one frame and outputs to file.
      ffmpegArgs.push('-f', 'avfoundation', '-i', '1', '-vframes', '1', '-y', outputFile);
    } else if (platform === 'win32') {
      // Windows - Use gdigrab for screen capture. 'desktop' captures the entire desktop.
      ffmpegArgs.push('-f', 'gdigrab', '-i', 'desktop', '-vframes', '1', '-y', outputFile);
    } else { // Linux
      try {
        const { execSync } = require('child_process');
        // Attempt to get full screen resolution via xrandr
        const xrandrOutput = execSync('xrandr | grep "\\*" | cut -d" " -f4').toString().trim();
        const fullResolution = xrandrOutput || '1920x1080';
        const display = process.env.DISPLAY || ':0.0';

        ffmpegArgs.push(
          '-f', 'x11grab',
          '-video_size', fullResolution,
          '-i', `${display}`,
          '-vframes', '1',
          '-y', outputFile,
        );
      } catch (e) {
        this.logger.warn(`Failed to detect display resolution with xrandr for screenshot: ${e.message}. Using default.`);
        // Fallback for Linux if xrandr fails or is not available
        ffmpegArgs.push('-f', 'x11grab', '-i', ':0.0', '-vframes', '1', '-y', outputFile);
      }
    }
    return ffmpegArgs;
  }
}
