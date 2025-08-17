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
import * as screenshot from 'screenshot-desktop';
import { join, dirname } from 'path';
import { writeFile, stat, unlink, mkdir, readdir } from 'fs/promises';

import { PrismaService } from '../prisma/prisma.service';
import { TerminalService } from '../terminal/terminal.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { StartRecordingResponseDto } from './dto/start-recording-response.dto';
import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private recordingProcess: ChildProcessWithoutNullStreams | null = null;
  private stopTimer: NodeJS.Timeout | null = null;
  private currentRecordingFile: string | null = null;
  private recordingStartTime: number | null = null;
  private recordingFile: string | null = null;
  private lastRecordingMetadata: Record<string, any> | null = null;
  private startedAt: Date | null = null;
  constructor(
    private prisma: PrismaService,
    private terminal: TerminalService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  /**
   * Returns the current recording status.
   */
  async getRecordingStatus(id?: string): Promise<{
    id: string;
    recording: boolean;
    file: string | null;
    startedAt: string | null;
  }> {
    if (!id) {
      const recordings = await this.prisma.recording.findFirst({
        where: { createdById: this.userId, status: 'recording' },
      });
      if (!recordings) {
        return {
          id: '',
          recording: false,
          file: null,
          startedAt: null,
        };
      }

      return {
        id: recordings?.id,
        recording: recordings?.status === 'recording' ? true : false,
        file: recordings?.path,
        startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      };
    } else {
      const currentRecording = await this.findOne(id);
      if (!currentRecording) {
        throw new NotFoundException(`Recording with ID ${id} not found.`);
      }
      return {
        id: currentRecording.id,
        recording: currentRecording.status === 'recording' ? true : false,
        file: currentRecording.path,
        startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      };
    }
  }

  /**
   * Retrieves metadata of a recording file.
   * @param file Path or filename
   */
  async getMetadata(file: string): Promise<{ size: number; modified: string }> {
    const filePath = file.includes('/')
      ? file
      : join(process.cwd(), 'downloads', 'recordings', file);
    const stats = await stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  }

  /**
   * Lists all recording files.
   */
  async listRecordings(): Promise<string[]> {
    const dir = join(
      process.cwd(),
      'downloads',
      'recordings',
      `${this.userId}`,
    );
    const files = await readdir(dir);
    return files.map((f) => join(dir, f));
  }

  /**
   * Deletes recordings older than N days.
   * @param days Number of days to use as threshold
   */
  async cleanupOld(days: number = 7): Promise<{ deleted: string[] }> {
    const dir = join(
      process.cwd(),
      'downloads',
      'recordings',
      `${this.userId}`,
    );
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

    if (this.userId) {
      createData.createdBy = {
        connect: { id: this.userId },
      };
      delete createData.createdById;
    }

    return this.prisma.recording.create({ data: createData });
  }

  async findAllPaginated(
    where: Prisma.RecordingWhereInput = { createdById: this.userId },
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

  findAll() {
    return this.prisma.recording.findMany({
      where: { createdById: this.userId },
    });
  }

  findOne(id: string) {
    return this.prisma.recording.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateRecordingDto) {
    return this.prisma.recording.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const recording = await this.prisma.recording.findUnique({ where: { id } });

    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found.`);
    }

    try {
      await unlink(recording.path);
      this.logger.log(`Deleted file: ${recording.path}`);
    } catch (err) {
      this.logger.warn(
        `Failed to delete file: ${recording.path}. Error: ${err.message}`,
      );
    }

    return this.prisma.recording.delete({ where: { id } });
  }

  async captureScreen(): Promise<{ id: string; status: string; path: string }> {
    if (!this.userId) {
      throw new BadRequestException(
        'User ID is required to capture a screenshot.',
      );
    }

    const outputPath = join(
      process.cwd(),
      'downloads',
      'screenshots',
      this.userId,
      `captured-${Date.now()}.png`,
    );

    await mkdir(dirname(outputPath), { recursive: true });

    const imgBuffer = await screenshot({ format: 'png' });
    await writeFile(outputPath, imgBuffer);

    this.logger.log(`Screenshot saved to ${outputPath}`);

    const recording = await this.prisma.recording.create({
      data: {
        path: outputPath,
        type: 'screenShot',
        status: 'finished',
        pid: '0', // No process ID for a screenshot
        data: {
          capturedAt: new Date().toISOString(),
        },
        createdBy: { connect: { id: this.userId } },
      },
    });

    return {
      id: recording.id,
      status: recording.status,
      path: recording.path,
    };
  }

  async startRecording(): Promise<StartRecordingResponseDto> {
    if (!this.userId) {
      throw new BadRequestException(
        'User ID is required to start a recording.',
      );
    }

    const outputFile = join(
      process.cwd(),
      'downloads',
      'recordings',
      this.userId,
      `recorded-${Date.now()}.mp4`,
    );
    const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
    if (ffmpegCheck.error) {
      throw new InternalServerErrorException(
        'FFmpeg is not installed or not in PATH.',
      );
    }
    await mkdir(dirname(outputFile), { recursive: true });

    const ffmpegArgs = this.getFfmpegArgs(outputFile);
    this.logger.log(`Starting screen recording: ${outputFile}`);

    this.recordingProcess = spawn('ffmpeg', ffmpegArgs);
    this.currentRecordingFile = outputFile;
    this.recordingStartTime = Date.now();
    this.lastRecordingMetadata = { startedAt: new Date().toISOString() };

    if (!this.recordingProcess?.pid) {
      throw new InternalServerErrorException(
        'Failed to start recording process.',
      );
    }

    const pid = this.recordingProcess.pid;

    const recording = await this.prisma.recording.create({
      data: {
        path: outputFile,
        type: 'screenRecord',
        status: 'recording',
        pid: String(pid),
        data: {
          startedAt: this.lastRecordingMetadata.startedAt,
        },
        createdBy: { connect: { id: this.userId } },
      },
    });

    this.recordingProcess.stderr.on('data', (ffmpegData) => {
      this.logger.debug(`ffmpeg: ${ffmpegData}`);
    });

    this.recordingProcess.once('exit', async (code) => {
      this.logger.log(`Recording process exited with code ${code}`);
      this.recordingProcess = null;
      if (this.stopTimer) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      let duration = 0;
      let fileSize = 0;
      try {
        if (this.recordingStartTime !== null) {
          duration = (Date.now() - this.recordingStartTime) / 1000;
        }
        const fileStats = await stat(outputFile);
        fileSize = fileStats.size;
      } catch (err) {
        this.logger.warn(`Could not get file stats: ${err.message}`);
      }

      await this.prisma.recording.update({
        where: { id: recording.id },
        data: {
          status: 'ready',
          data: {
            ...(typeof recording.data === 'object' ? recording.data : {}),
            stoppedAt: new Date().toISOString(),
            duration,
            fileSize,
          },
        },
      });

      this.logger.log(
        `Recording metadata updated: duration=${duration}s, fileSize=${fileSize} bytes`,
      );
    });

    this.stopTimer = setTimeout(() => {
      this.logger.log('Auto-stopping recording after 2 hours limit.');
      this.stopRecording(recording.id);
    }, 7200 * 1000);

    return { path: outputFile, id: recording.id };
  }

  async stopRecording(
    id: string,
  ): Promise<{ id: string; status: string; path: string }> {
    const getRecording = await this.prisma.recording.findUnique({
      where: { id },
    });

    if (!getRecording) {
      throw new BadRequestException(
        `No saved recording in the database with this id: ${id}.`,
      );
    }

    const pid = Number(getRecording.pid);
    this.logger.log(`Running command: kill ${pid}`);
    const runStopped = await this.terminal.runCommandOnce(`kill ${pid}`, './');

    if (!runStopped) {
      throw new BadRequestException(
        `Recording did not stop for recording id: ${id}.`,
      );
    }

    await this.prisma.recording.update({
      where: { id },
      data: {
        status: 'finished',
        data: {
          ...(typeof getRecording.data === 'object' &&
          getRecording.data !== null
            ? getRecording.data
            : {}),
          stoppedAt: new Date().toISOString(),
        },
      },
    });

    return { id, status: 'finished', path: getRecording.path };
  }

  private getFfmpegArgs(outputFile: string): string[] {
    const commonOutputArgs = [
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-tune',
      'zerolatency',
      '-pix_fmt',
      'yuv420p',
      '-b:v',
      '1M',
      '-r',
      '30',

      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',

      '-movflags',
      '+faststart',
    ];

    if (process.platform === 'darwin') {
      return [
        '-f',
        'avfoundation',
        '-framerate',
        '30',
        '-i',
        '1:0',
        ...commonOutputArgs,
        outputFile,
      ];
    }

    if (process.platform === 'win32') {
      return [
        '-f',
        'gdigrab',
        '-framerate',
        '30',
        '-i',
        'desktop',

        '-f',
        'dshow',
        '-i',
        'audio=virtual-audio-capturer',

        ...commonOutputArgs,
        outputFile,
      ];
    }

    const display = process.env.DISPLAY || ':0.0';
    const resolution = process.env.RESOLUTION || '1920x1080';
    const audioDevice = process.env.AUDIO_DEVICE || 'default';

    return [
      '-video_size',
      resolution,
      '-framerate',
      '30',
      '-f',
      'x11grab',
      '-i',
      `${display}`,

      //'-f',
      //'pulse',
      //'-i',
      //audioDevice,

      ...commonOutputArgs,
      outputFile,
    ];
  }
}
