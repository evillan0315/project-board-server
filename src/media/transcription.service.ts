import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';
import { MetadataType } from '@prisma/client';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number;
  language?: string;
  languageProbability?: number;
  model?: string;
  device?: string;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Transcribe audio file using faster-whisper
   */
  async transcribeAudio(filePath: string): Promise<TranscriptionResult> {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    try {
      const transcription = await this.transcribeWithFasterWhisper(filePath);
      return transcription;
    } catch (error) {
      this.logger.error(`Transcription failed: ${error.message}`);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe using faster-whisper via Python script
   */
  private async transcribeWithFasterWhisper(
    filePath: string,
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      // Prioritize environment variable, otherwise use Python from project's virtual environment
      const pythonPath =
        process.env.PYTHON_PATH ||
        path.join(process.cwd(), '.venv', 'bin', 'python3.12');
      const scriptPath = path.join(process.cwd(), 'transcribe.py');

      this.logger.debug(`Starting transcription with Python: ${pythonPath}`);
      this.logger.debug(`Script path: ${scriptPath}`);
      this.logger.debug(`Audio file: ${filePath}`);

      const python = spawn(pythonPath, [scriptPath, filePath]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.debug(`Python stderr: ${data.toString()}`);
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);

            if (result.error) {
              this.logger.error(`Python script error: ${result.error}`);
              reject(new Error(`Python script error: ${result.error}`));
              return;
            }

            this.logger.log(
              `Transcription completed successfully for: ${filePath}`,
            );
            resolve(result);
          } catch (parseError) {
            this.logger.error(
              `Failed to parse transcription output: ${parseError.message}`,
            );
            this.logger.debug(`Raw output: ${stdout}`);
            reject(
              new Error(
                `Failed to parse transcription output: ${parseError.message}`,
              ),
            );
          }
        } else {
          this.logger.error(
            `Python script failed with code ${code}: ${stderr}`,
          );
          reject(
            new Error(`Python script failed with code ${code}: ${stderr}`),
          );
        }
      });

      python.on('error', (error) => {
        this.logger.error(`Failed to start Python process: ${error.message}`);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Save transcription to database
   */
  async saveTranscription(
    fileId: string,
    transcription: TranscriptionResult,
  ): Promise<void> {
    try {
      await this.prisma.metadata.create({
        data: {
          fileId: fileId,
          type: MetadataType.TRANSCRIPT,
          data: transcription as any,
          tags: ['transcription', 'audio-to-text', 'faster-whisper'],
        },
      });

      this.logger.log(`Transcription saved for file: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to save transcription: ${error.message}`);
      throw new Error(`Failed to save transcription: ${error.message}`);
    }
  }

  /**
   * Get transcription for a file
   */
  async getTranscription(fileId: string): Promise<TranscriptionResult | null> {
    try {
      const metadata = await this.prisma.metadata.findFirst({
        where: {
          fileId: fileId,
          type: MetadataType.TRANSCRIPT,
        },
      });

      if (!metadata) {
        return null;
      }

      return metadata.data as unknown as TranscriptionResult;
    } catch (error) {
      this.logger.error(`Failed to get transcription: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate synchronized text with timing information
   */
  generateSynchronizedText(transcription: TranscriptionResult): {
    segments: TranscriptionSegment[];
    fullText: string;
    duration: number;
  } {
    return {
      segments: transcription.segments,
      fullText: transcription.fullText,
      duration: transcription.duration,
    };
  }

  /**
   * Get current text segment based on playback time
   */
  getCurrentSegment(
    transcription: TranscriptionResult,
    currentTime: number,
  ): {
    currentSegment: TranscriptionSegment | null;
    previousSegments: TranscriptionSegment[];
    upcomingSegments: TranscriptionSegment[];
  } {
    const segments = transcription.segments;
    let currentSegment: TranscriptionSegment | null = null;
    const previousSegments: TranscriptionSegment[] = [];
    const upcomingSegments: TranscriptionSegment[] = [];

    for (const segment of segments) {
      if (currentTime >= segment.start && currentTime <= segment.end) {
        currentSegment = segment;
      } else if (currentTime > segment.end) {
        previousSegments.push(segment);
      } else {
        upcomingSegments.push(segment);
      }
    }

    return {
      currentSegment,
      previousSegments,
      upcomingSegments,
    };
  }
}
