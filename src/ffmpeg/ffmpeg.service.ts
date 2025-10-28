import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams, spawnSync } from 'child_process';
import { DeviceDto, DevicesListDto, DeviceType } from './dto/device.dto';

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  /**
   * Lists available audio and video input devices using FFmpeg.
   * The implementation is platform-specific.
   * @returns A promise that resolves to an object containing lists of audio and video input devices.
   */
  async listInputDevices(): Promise<DevicesListDto> {
    const platform = process.platform;
    let audioInputDevices: DeviceDto[] = [];
    let videoInputDevices: DeviceDto[] = [];

    try {
      if (platform === 'darwin') {
        // macOS uses avfoundation
        const output = await this._executeFfmpegListDevices(['-f', 'avfoundation', '-list_devices', 'true', '-i', '""']);
        ({ audio: audioInputDevices, video: videoInputDevices } = this._parseMacDevices(output));
      } else if (platform === 'win32') {
        // Windows uses dshow
        const output = await this._executeFfmpegListDevices(['-f', 'dshow', '-list_devices', 'true', '-i', 'dummy']);
        ({ audio: audioInputDevices, video: videoInputDevices } = this._parseWinDevices(output));
      } else if (platform === 'linux') {
        // Linux can use v4l2 for video, pulse or alsa for audio
        // Attempt to list audio devices via PulseAudio directly, which is more reliable than ffmpeg on some systems
        audioInputDevices = await this._listLinuxAudioDevices();
        videoInputDevices = await this._listLinuxVideoDevices();

      } else {
        throw new InternalServerErrorException(
          `Unsupported operating system for device listing: ${platform}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to list devices on ${platform}: ${error.message}`, error.stack);
      // Still return empty arrays rather than throwing, so frontend can show 'no devices'
      return { audioInputDevices: [], videoInputDevices: [] };
    }

    return { audioInputDevices, videoInputDevices };
  }

  private async _executeFfmpegListDevices(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // For some FFmpeg list_devices commands, the output is on stderr, not stdout.
      // We use 'null' for stdout to ignore it, and capture stderr.
      const ffmpeg = spawn('ffmpeg', args, { stdio: ['inherit', 'pipe', 'pipe'] });
      let stderrOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 || code === 1) { // ffmpeg -list_devices often exits with 1 even on success
          resolve(stderrOutput);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderrOutput}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to spawn FFmpeg process: ${err.message}`));
      });
    });
  }

  private _parseMacDevices(output: string): { audio: DeviceDto[]; video: DeviceDto[] } {
    const audioDevices: DeviceDto[] = [];
    const videoDevices: DeviceDto[] = [];
    let parsingAudio = false;
    let parsingVideo = false;

    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('AVFoundation audio devices:')) {
        parsingAudio = true;
        parsingVideo = false;
        continue;
      }
      if (line.includes('AVFoundation video devices:')) {
        parsingVideo = true;
        parsingAudio = false;
        continue;
      }

      const match = line.match(/\[(\d+)\] (.+)/);
      if (match) {
        const id = match[1];
        const name = match[2];
        if (parsingAudio) {
          audioDevices.push({ id, name, type: DeviceType.AUDIO_INPUT });
        } else if (parsingVideo) {
          videoDevices.push({ id, name, type: DeviceType.VIDEO_INPUT });
        }
      }
    }
    return { audio: audioDevices, video: videoDevices };
  }

  private _parseWinDevices(output: string): { audio: DeviceDto[]; video: DeviceDto[] } {
    const audioDevices: DeviceDto[] = [];
    const videoDevices: DeviceDto[] = [];

    const lines = output.split('\n');
    let currentDeviceType: DeviceType | null = null;

    for (const line of lines) {
      if (line.includes('DirectShow audio devices')) {
        currentDeviceType = DeviceType.AUDIO_INPUT;
        continue;
      }
      if (line.includes('DirectShow video devices')) {
        currentDeviceType = DeviceType.VIDEO_INPUT;
        continue;
      }

      const deviceMatch = line.match(/"([^"]+)"/); // Matches quoted names
      if (deviceMatch && currentDeviceType) {
        const name = deviceMatch[1];
        // On Windows, often the name is also the ID for dshow
        const id = name;
        if (currentDeviceType === DeviceType.AUDIO_INPUT) {
          audioDevices.push({ id, name, type: DeviceType.AUDIO_INPUT });
        } else if (currentDeviceType === DeviceType.VIDEO_INPUT) {
          videoDevices.push({ id, name, type: DeviceType.VIDEO_INPUT });
        }
      }
    }
    return { audio: audioDevices, video: videoDevices };
  }

  // Linux device listing is more complex due to variations in audio/video stacks.
  // This attempts to use common CLI tools.
  private async _listLinuxAudioDevices(): Promise<DeviceDto[]> {
    const audioDevices: DeviceDto[] = [];
    try {
      const pactlList = spawnSync('pactl', ['list', 'short', 'sources']);
      if (pactlList.status === 0) {
        const output = pactlList.stdout.toString();
        const lines = output.split('\n');
        for (const line of lines) {
          // Example: 0\talsa_input.pci-0000_00_1b.0.analog-stereo\tmodule-alsa-card.c\ts.input\t0\t44100\t2\t0\t0
          const parts = line.split(/\s+/);
          if (parts.length > 1) {
            const id = parts[1]; // e.g., alsa_input.pci-0000_00_1b.0.analog-stereo
            // Attempt to get a more user-friendly name if available, otherwise use ID
            const name = parts.length > 8 ? parts[8].replace(/\./g, ' ') : id; // Simple heuristic
            if (id.includes('input')) { // Filter for input devices
              audioDevices.push({ id, name, type: DeviceType.AUDIO_INPUT });
            }
          }
        }
      } else {
        this.logger.warn(`pactl list short sources failed: ${pactlList.stderr.toString()}`);
      }
    } catch (e) {
      this.logger.warn(`Could not use pactl to list audio devices: ${e.message}`);
    }

    // Fallback to ffmpeg -list_devices (less reliable for Linux)
    if (audioDevices.length === 0) {
      try {
        const output = await this._executeFfmpegListDevices(['-f', 'alsa', '-list_devices', 'true', '-i', 'null']); // Try ALSA
        const lines = output.split('\n');
        for (const line of lines) {
          const match = line.match(/Card (\d+): ([^\n]+)/); // Matches "Card X: Name"
          const deviceMatch = line.match(/Device (\d+): ([^\n]+)/); // Matches "Device X: Name"
          if (match) {
            const cardName = match[2];
            // Try to find devices associated with this card
            const deviceLines = lines.filter(l => l.includes(`Card ${match[1]}:`));
            for (const devLine of deviceLines) {
              const subMatch = devLine.match(/Device (\d+): (.+)/);
              if (subMatch) {
                const id = `hw:${match[1]},${subMatch[1]}`; // e.g., hw:0,0
                const name = `${cardName} - ${subMatch[2].trim()}`; // e.g., HDA Intel PCH - ALC892 Analog
                audioDevices.push({ id, name, type: DeviceType.AUDIO_INPUT });
              }
            }
          }
        }
      } catch (e) {
        this.logger.warn(`FFmpeg ALSA list devices failed: ${e.message}`);
      }
    }

    // Add a 'default' option if no specific devices are found, or if PulseAudio is the main system.
    if (!audioDevices.some(d => d.id === 'default' || d.name === 'Default Audio Input')) {
        audioDevices.unshift({ id: 'default', name: 'Default Audio Input', type: DeviceType.AUDIO_INPUT });
    }
    return audioDevices;
  }

  private async _listLinuxVideoDevices(): Promise<DeviceDto[]> {
    const videoDevices: DeviceDto[] = [];
    try {
      // Prefer v4l2-ctl for more robust video device listing
      const v4l2ctlList = spawnSync('v4l2-ctl', ['--list-devices']);
      if (v4l2ctlList.status === 0) {
        const output = v4l2ctlList.stdout.toString();
        const lines = output.split('\n');
        let currentDeviceName: string | null = null;
        for (const line of lines) {
          const deviceNameMatch = line.match(/(.+):\n/); // Matches "Device Name:"
          if (deviceNameMatch) {
            currentDeviceName = deviceNameMatch[1].trim();
          }
          const devicePathMatch = line.match(/\s*(\/dev\/video\d+)/); // ESCAPED FORWARD SLASHES
          if (devicePathMatch && currentDeviceName) {
            const id = devicePathMatch[1];
            videoDevices.push({ id, name: currentDeviceName, type: DeviceType.VIDEO_INPUT });
            currentDeviceName = null; // Reset for next device
          }
        }
      } else {
        this.logger.warn(`v4l2-ctl --list-devices failed: ${v4l2ctlList.stderr.toString()}`);
      }
    } catch (e) {
      this.logger.warn(`Could not use v4l2-ctl to list video devices: ${e.message}`);
      // Fallback to scanning /dev/video* directly if v4l2-ctl fails
      try {
        const fs = require('fs/promises');
        const files = await fs.readdir('/dev');
        for (const file of files) {
          if (file.startsWith('video')) {
            const id = `/dev/${file}`;
            videoDevices.push({ id, name: `Video Device (${id})`, type: DeviceType.VIDEO_INPUT });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to scan /dev for video devices: ${err.message}`);
      }
    }

    // Add a 'default' option if no specific devices are found.
    if (!videoDevices.some(d => d.id === 'default' || d.name === 'Default Video Input')) {
        videoDevices.unshift({ id: 'default', name: 'Default Video Input', type: DeviceType.VIDEO_INPUT });
    }
    return videoDevices;
  }

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
   * @param options Recording options like resolution, fps, and audio device.
   * @returns A promise that resolves with the ChildProcess of FFmpeg, or rejects on error.
   */
  startCameraRecording(
    inputDevice: string | undefined,
    outputPath: string,
    emitProgress: (progress: { time: string }) => void,
    options?: { resolution?: string; fps?: number; audioDevice?: string }, // Added audioDevice
  ): Promise<ChildProcessWithoutNullStreams> {
    return new Promise((resolve, reject) => {
      const { resolution = '1280x720', fps = 30, audioDevice } = options || {}; // Destructure audioDevice

      const ffmpegArgs = this._getCameraFfmpegArgs(
        inputDevice,
        audioDevice, // Pass new audioDevice parameter
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
   * @param audioInputDevice The specific audio input device (e.g., 'alsa_input.pci-0000_00_1b.0.analog-stereo').
   * @param resolution The desired resolution (e.g., '1280x720').
   * @param fps Frames per second.
   * @param outputPath The output file path.
   * @returns An array of FFmpeg arguments.
   */
  private _getCameraFfmpegArgs(
    cameraDevice: string | undefined,
    audioInputDevice: string | undefined, // New parameter
    resolution: string,
    fps: number,
    outputPath: string,
  ): string[] {
    const commonOutputArgs = [
      '-c:v',
      'libx264',
      '-preset',
      'veryfast', // Changed from 'ultrafast'
      '-crf', // Added Constant Rate Factor for quality
      '23', // CRF value as per request
      '-c:a',
      'aac',
      // Removed: '-tune', 'zerolatency', '-pix_fmt', 'yuv420p', '-b:v', '1M', '-b:a', '128k', '-ar', '44100'
      // to align with the user's simpler request and rely on FFmpeg defaults for audio encoding parameters.
      '-movflags',
      '+faststart',
      '-y',
    ];

    if (process.platform === 'darwin') {
      // macOS uses avfoundation. '0:0' for default camera and microphone.
      // '0' refers to the first video input, '0' after ':' refers to the first audio input.
      // FFmpeg avfoundation requires video and audio device IDs to be specified together as N:M
      // A single '0' or 'default' will usually refer to the first available camera/mic.
      const inputString = cameraDevice && audioInputDevice ? `${cameraDevice}:${audioInputDevice}` : '0:0';
      this.logger.debug(`macOS camera input: ${inputString}`);
      return [
        '-f',
        'avfoundation',
        '-framerate',
        fps.toString(),
        '-video_size',
        resolution,
        '-i',
        inputString,
        ...commonOutputArgs,
        outputPath,
      ];
    } else if (process.platform === 'win32') {
      // Windows uses dshow (DirectShow).
      // You might need to list devices: ffmpeg -list_devices true -f dshow -i dummy
      const videoInput = cameraDevice || 'video=Integrated Camera'; // Example default
      const audioInput = audioInputDevice || 'audio=Microphone (Realtek(R) Audio)'; // Use new param or example default
      this.logger.debug(`Windows camera input: ${videoInput} | ${audioInput}`);

      return [
        '-f',
        'dshow',
        '-i',
        `${videoInput}:${audioInput}`, // dshow combines video and audio input this way
        '-s', // Specify resolution after input for dshow
        resolution,
        ...commonOutputArgs,
        outputPath,
      ];
    } else if (process.platform === 'linux') {
      // Linux typically uses v4l2 for video and pulse/alsa for audio.
      // You might need to list devices: ffmpeg -f v4l2 -list_formats all -i /dev/video0
      // For audio: pactl list sources or arecord -L
      const videoInput = cameraDevice || '/dev/video0'; // Default video device
      const audioInput = audioInputDevice || process.env.AUDIO_DEVICE || 'default'; // Prioritize DTO, then env, then 'default'
      this.logger.debug(`Linux camera input: ${videoInput} | ${audioInput}`);

      return [
        '-f',
        'v4l2',
        '-framerate', // Added for input
        fps.toString(),
        '-video_size', // Changed from '-s'
        resolution,
        '-i',
        videoInput,
        '-f',
        'pulse',
        '-i',
        audioInput,
        ...commonOutputArgs,
        outputPath,
      ];
    } else {
      throw new InternalServerErrorException(
        `Unsupported operating system for camera recording: ${process.platform}`,
      );
    }
  }
}