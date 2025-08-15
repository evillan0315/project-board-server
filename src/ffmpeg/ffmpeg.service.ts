import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class FfmpegService {
  transcodeToHLS(
    inputPath: string,
    outputPath: string,
    emitProgress: (progress: { time: string }) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-profile:v',
        'main', // good compatibility profile
        '-level',
        '3.1', // compatibility level
        '-c:a',
        'aac', // audio codec
        '-b:a',
        '128k', // audio bitrate
        '-ac',
        '2', // stereo
        '-preset',
        'veryfast',
        '-hls_time',
        '4', // segment duration in seconds
        '-hls_list_size',
        '0', // keep all segments
        '-hls_segment_filename',
        outputPath.replace(/\.m3u8$/, '_%03d.ts'),
        '-f',
        'hls',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (match) {
          emitProgress({ time: match[1] });
        }
      });

      ffmpeg.on('close', (code) => {
        code === 0
          ? resolve()
          : reject(new Error(`FFmpeg exited with code ${code}`));
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  transcodeToMp4(
    inputPath: string,
    outputPath: string,
    emitProgress: (progress: { time: string }) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i',
        inputPath,
        '-c:v',
        'libx264', // video codec
        '-profile:v',
        'main',
        '-level',
        '3.1',
        '-preset',
        'fast',
        '-c:a',
        'aac', // audio codec
        '-b:a',
        '128k',
        '-movflags',
        '+faststart', // enable seeking before full download
        '-y', // overwrite output if exists
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (match) {
          emitProgress({ time: match[1] });
        }
      });

      ffmpeg.on('close', (code) => {
        code === 0
          ? resolve()
          : reject(new Error(`FFmpeg exited with code ${code}`));
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }
}
