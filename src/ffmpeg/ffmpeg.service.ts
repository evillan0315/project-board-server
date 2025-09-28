import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

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

  /**
   * Transcodes a video input to an optimized GIF.
   * Uses a two-pass palette generation approach within a single ffmpeg command for better quality,
   * balancing file size and visual fidelity.
   *
   * @param inputPath Path to the input video file (e.g., recorded screen video).
   * @param outputPath Path where the output GIF will be saved (e.g., 'output.gif').
   * @param emitProgress Callback to emit progress updates (note: progress for GIF might be less granular).
   * @param options Optional GIF specific settings like `fps` and `width`.
   * @returns A promise that resolves when transcoding is complete.
   */
  transcodeToGif(
    inputPath: string,
    outputPath: string,
    emitProgress: (progress: { time: string }) => void,
    options?: {
      fps?: number; // Frames per second for the GIF (default: 15). Lower for smaller files.
      width?: number; // Width of the GIF (default: 480, maintains aspect ratio). Lower for smaller files.
      loop?: number; // How many times the GIF should loop (default: 0 for infinite loop). -1 for no loop.
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { fps = 15, width = 480, loop = 0 } = options || {};

      // The filter_complex explained:
      // 1. '[0:v] fps=${fps},scale=${width}:-1:flags=lanczos':
      //    - Selects the video stream (0:v).
      //    - Sets the output frames per second (e.g., 15 fps).
      //    - Scales the video to the specified `width`, with `-1` maintaining aspect ratio,
      //      using `lanczos` for high-quality scaling.
      // 2. 'split[a][b]': Splits the processed video stream into two identical streams, labeled 'a' and 'b'.
      // 3. '[a]palettegen[p]':
      //    - Takes stream 'a' and generates an optimal color palette for the GIF, outputting it as stream 'p'.
      // 4. '[b][p]paletteuse':
      //    - Takes stream 'b' (the original video content) and stream 'p' (the generated palette)
      //      and uses the palette to create the final GIF frames.
      const args = [
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v] fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`,
        '-loop', // Set GIF looping behavior
        loop.toString(),
        '-f', // Force output format to GIF
        'gif',
        '-y', // Overwrite output if it exists
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        // FFmpeg's progress output for GIFs (especially during palettegen)
        // might not always include the 'time=' format reliably.
        const match = output.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (match) {
          emitProgress({ time: match[1] });
        }
        // this.logger.debug(`FFmpeg GIF stderr: ${output}`); // Uncomment for verbose FFmpeg output
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Starts recording from a camera device using FFmpeg.
   * @param inputDevice The camera device identifier (platform-specific).
   * @param outputPath The full path where the recorded video will be saved.
   * @param emitProgress Callback to emit progress updates.
   * @param options Recording options like resolution and fps.
   * @returns A promise that resolves with the ChildProcess of FFmpeg, or rejects on error.
   */
  startCameraRecording(
    inputDevice: string,
    outputPath: string,
    emitProgress: (progress: { time: string }) => void,
    options?: { resolution?: string; fps?: number },
  ): Promise<ChildProcessWithoutNullStreams> {
    return new Promise((resolve, reject) => {
      const { resolution = '1280x720', fps = 30 } = options || {};

      const ffmpegArgs = this._getCameraFfmpegArgs(
        inputDevice,
        resolution,
        fps,
        outputPath,
      );

      this.logger.log(`Starting camera recording with command: ffmpeg ${ffmpegArgs.join(' ')}`);

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (match) {
          emitProgress({ time: match[1] });
        }
        // this.logger.debug(`FFmpeg Camera stderr: ${output}`); // Uncomment for verbose FFmpeg output
      });

      ffmpegProcess.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `FFmpeg camera recording process exited with code ${code}`,
            ),
          );
        }
      });

      ffmpegProcess.on('error', (err) => {
        reject(new InternalServerErrorException(`Failed to start FFmpeg camera recording: ${err.message}`));
      });

      // Give ffmpeg a moment to start and ensure it hasn't immediately errored
      setTimeout(() => {
        if (ffmpegProcess.pid) {
          resolve(ffmpegProcess);
        } else {
          reject(new InternalServerErrorException('FFmpeg camera recording process did not start.'));
        }
      }, 1000); // Wait 1 second to confirm process is running
    });
  }

  /**
   * Internal helper to get platform-specific FFmpeg arguments for camera recording.
   * @param cameraDevice The camera device identifier.
   * @param resolution The desired resolution (e.g., '1280x720').
   * @param fps Frames per second.
   * @param outputPath The output file path.
   * @returns An array of FFmpeg arguments.
   */
  private _getCameraFfmpegArgs(
    cameraDevice: string,
    resolution: string,
    fps: number,
    outputPath: string,
  ): string[] {
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
      fps.toString(),
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-movflags',
      '+faststart',
      '-y',
      outputPath,
    ];

    if (process.platform === 'darwin') {
      // macOS uses avfoundation. '0:0' for default camera and microphone.
      // '0' refers to the first video input, '0' after ':' refers to the first audio input.
      return [
        '-f',
        'avfoundation',
        '-framerate',
        fps.toString(),
        '-video_size',
        resolution,
        '-i',
        cameraDevice || '0:0',
        ...commonOutputArgs,
      ];
    } else if (process.platform === 'win32') {
      // Windows uses dshow (DirectShow).
      // You might need to list devices: ffmpeg -list_devices true -f dshow -i dummy
      const videoDevice = cameraDevice || 'video=Integrated Camera'; // Example default
      const audioDevice = 'audio=Microphone (Realtek(R) Audio)'; // Example default, adjust as needed

      return [
        '-f',
        'dshow',
        '-s',
        resolution,
        '-i',
        `${videoDevice}:${audioDevice}`,
        ...commonOutputArgs,
      ];
    } else if (process.platform === 'linux') {
      // Linux typically uses v4l2 for video and pulse/alsa for audio.
      // You might need to list devices: ffmpeg -f v4l2 -list_formats all -i /dev/video0
      // For audio: pactl list sources or arecord -L
      const videoDevice = cameraDevice || '/dev/video0'; // Default video device
      const audioDevice = process.env.AUDIO_DEVICE || 'default'; // PulseAudio default or ALSA device

      return [
        '-f',
        'v4l2',
        '-s',
        resolution,
        '-i',
        videoDevice,
        '-f',
        'pulse',
        '-i',
        audioDevice,
        ...commonOutputArgs,
      ];
    } else {
      throw new InternalServerErrorException(
        `Unsupported operating system for camera recording: ${process.platform}`,
      );
    }
  }
}
