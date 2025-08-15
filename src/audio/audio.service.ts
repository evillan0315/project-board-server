import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly downloadDir = path.resolve(process.cwd(), 'downloads');
  private readonly cookiesDir = path.resolve(process.cwd(), 'cookies');

  constructor() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  extractAudioVideoFromYoutube(
    url: string,
    format: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv' = 'webm',
    onProgress?: (info: {
      percent: number;
      downloaded?: number;
      total?: number;
    }) => void,
    onFilePathReady?: (filePath: string) => void,
    provider?: string,
    cookieAccess?: boolean,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputTemplate = path.join(this.downloadDir, '%(title)s.%(ext)s');
      const isAudio = ['mp3', 'm4a', 'wav'].includes(format);
      const args: string[] = [];

      // cookies if needed
      if (cookieAccess && provider) {
        const cookieFile = path.join(
          this.cookiesDir,
          `${provider}_cookies.txt`,
        );
        if (fs.existsSync(cookieFile)) {
          args.push('--cookies', cookieFile);
        }
      }

      // format args
      if (isAudio) {
        args.push('-x', '--audio-format', format);
      } else {
        args.push('-f', `bestvideo[ext=${format}]+bestaudio/best`);
      }
      args.push('-o', outputTemplate, url);

      const ytDlp = spawn('yt-dlp', args);
      let filePath: string | null = null;
      let filePathEmitted = false;

      // listen to stderr (yt-dlp writes progress & destination there)
      ytDlp.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        for (const line of text.split('\n')) {
          // 1) progress lines: "[download]  12.3% of 4.56MiB at 123.45KiB/s"
          const prog = line.match(
            /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([\d.]+[KMG]?B)\s+at\s+([\d.]+[KMG]?B\/s)/,
          );
          if (prog && onProgress) {
            const percent = parseFloat(prog[1]);
            const totalSize = this.parseSize(prog[2]);
            const downloadedSize = (percent * totalSize) / 100;
            onProgress({
              percent,
              downloaded: downloadedSize,
              total: totalSize,
            });
          }

          // 2) destination line: "[download] Destination: file.webm" or "[ExtractAudio] Destination: file.mp3"
          const dest = line.match(
            isAudio
              ? /\[ExtractAudio\] Destination:\s+(.+)/
              : /\[download\] Destination:\s+(.+)/,
          );
          if (dest && !filePathEmitted) {
            let resolved = dest[1].trim();
            if (!path.isAbsolute(resolved)) {
              resolved = path.join(this.downloadDir, resolved);
            }
            filePath = resolved;
            filePathEmitted = true;
            if (onFilePathReady) {
              onFilePathReady(resolved);
            }
          }
        }
      });

      ytDlp.on('error', (err) => {
        this.logger.error('yt-dlp failed to start', err);
        reject(err);
      });

      ytDlp.on('close', (code) => {
        if (code === 0 && filePath) {
          resolve(filePath);
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });
    });
  }

  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1 << 10,
      MB: 1 << 20,
      GB: 1 << 30,
    };
    const m = sizeStr.match(/([\d.]+)([KMG]?B)/);
    if (!m) return 0;
    return parseFloat(m[1]) * (units[m[2]] || 1);
  }
}
