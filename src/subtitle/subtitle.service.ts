import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SubtitleService {
  private readonly logger = new Logger(SubtitleService.name);
  private readonly subtitlesDir = path.join(
    process.cwd(),
    'downloads/subtitles',
  );

  async generateSubtitleFromAudio(videoPath: string): Promise<string> {
    const timestamp = Date.now();
    const outputPath = path.join(this.subtitlesDir, `${timestamp}.vtt`);

    if (!fs.existsSync(this.subtitlesDir)) {
      fs.mkdirSync(this.subtitlesDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const whisper = spawn('whisper', [
        videoPath,
        '--output_format',
        'vtt',
        '--output_dir',
        this.subtitlesDir,
      ]);

      whisper.stderr.on('data', (data) => {
        this.logger.warn(`Whisper stderr: ${data}`);
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`Subtitle generated: ${outputPath}`);
          resolve(`/subtitles/${timestamp}.vtt`);
        } else {
          reject(new Error(`Whisper failed with code ${code}`));
        }
      });

      whisper.on('error', (err) => {
        reject(err);
      });
    });
  }
}
