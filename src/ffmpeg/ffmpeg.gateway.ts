import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FfmpegService } from './ffmpeg.service';
import { SubtitleService } from '../subtitle/subtitle.service';

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/ffmpeg',
  cors: { origin: '*', credentials: true },
})
export class FfmpegGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FfmpegGateway.name);
  private readonly hlsDir = path.join(process.cwd(), 'downloads/videos/hls');
  private readonly mp4Dir = path.join(process.cwd(), 'downloads/videos/mp4');

  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly subtitleService: SubtitleService,
  ) {}
  @SubscribeMessage('start_transcode_mp4')
  async handleStartTranscodeMp4(@MessageBody() data: { filePath: string }) {
    const inputPath = data.filePath;
    const timestamp = Date.now();
    const outputPath = path.join(this.mp4Dir, `${timestamp}.mp4`);

    try {
      this.logger.log(`Starting transcode for file: ${inputPath}`);
      this.logger.log(`Output MP4 playlist will be at: ${outputPath}`);
      await this.ffmpegService.transcodeToMp4(
        inputPath,
        outputPath,
        (progress) => {
          this.server.emit('transcode_progress', {
            filePath: inputPath,
            ...progress,
          });
        },
      );
      this.logger.log(`Starting subtitle creation for file: ${outputPath}`);
      this.server.emit('transcode_progress', {
        filePath: inputPath,
        progress: `Starting subtitle creation for file: ${outputPath}`,
      });
      const subtitleUrl =
        await this.subtitleService.generateSubtitleFromAudio(outputPath);

      this.server.emit('transcode_mp4_complete', {
        output: `/mp4/${timestamp}.mp4`,
        subtitle: subtitleUrl,
      });
    } catch (err) {
      this.server.emit('transcode_error', { message: err.message });
    }
  }
  @SubscribeMessage('start_transcode')
  async handleStartTranscode(
    @MessageBody() data: { filePath: string },
  ): Promise<void> {
    const inputPath = data.filePath;

    if (!fs.existsSync(this.hlsDir)) {
      try {
        fs.mkdirSync(this.hlsDir, { recursive: true });
      } catch (err) {
        this.logger.error(
          `Failed to create HLS directory: ${err.message}`,
          err.stack,
        );
        this.server.emit('transcode_error', {
          message: 'Server error: Unable to prepare output directory',
        });
        return;
      }
    }

    const timestamp = Date.now();
    const outputFileName = `${timestamp}.mp4`;
    const outputPath = path.join(this.hlsDir, outputFileName);

    this.logger.log(`Starting transcode for file: ${inputPath}`);
    this.logger.log(`Output HLS playlist will be at: ${outputPath}`);

    try {
      await this.ffmpegService.transcodeToMp4(
        inputPath,
        outputPath,
        (progress) => {
          this.server.emit('transcode_progress', {
            filePath: inputPath,
            ...progress,
          });
        },
      );

      this.server.emit('transcode_complete', {
        playlist: `/hls/${outputFileName}`,
      });
      this.logger.log(`Transcode complete: /hls/${outputFileName}`);
    } catch (err) {
      this.server.emit('transcode_error', { message: err.message });
      this.logger.error(`Transcode error: ${err.message}`, err.stack);
    }
  }
}
