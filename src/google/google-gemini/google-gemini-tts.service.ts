// full-stack/src/google/google-gemini/google-gemini-file/google-gemini-file.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  Scope,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as wav from 'wav';
import * as fs from 'fs';
import * as path from 'path';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CreateJwtUserDto } from '../../auth/dto/auth.dto';

interface SpeakerVoiceInput {
  speaker: string;
  voiceName: string;
}

@Injectable()
export class GoogleGeminiTtsService {
  private readonly ai: GoogleGenAI;
  private readonly downloadDir = path.resolve(process.cwd(), 'downloads');

  constructor(
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException(
        'GOOGLE_GEMINI_API_KEY not set',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }
  private get userId(): string {
    if (!this.request.user || !this.request.user.id) {
      throw new InternalServerErrorException(
        'User ID not found in request context. Authentication might be missing or misconfigured.',
      );
    }
    return this.request.user.id;
  }
  private async saveWaveFile(
    filename: string,
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
  ): Promise<void> {
    const baseTypeDirName = 'TTS';

    const currentUserId = this.userId;

    // Construct the target directory: downloads/<audio|videos>/<provider>/<userId>
    const dir = path.join(
      this.downloadDir,
      baseTypeDirName,
      'voice',
      currentUserId,
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fullPath = path.join(dir, filename);
    console.log(fullPath, 'fullPath saveWaveFile');
    return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(fullPath, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', () => resolve());
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  async generateSpeech(
    prompt: string,
    speakers: SpeakerVoiceInput[],
    languageCode: string = 'en-US',
  ): Promise<string> {
    try {
      const isMultiSpeaker = speakers.length > 1;

      const config: any = {
        responseModalities: ['AUDIO'],
        speechConfig: isMultiSpeaker
          ? {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: speakers.map((s) => ({
                  speaker: s.speaker,
                  voiceConfig: {
                    languageCode,
                    prebuiltVoiceConfig: { voiceName: s.voiceName },
                  },
                })),
              },
            }
          : {
              voiceConfig: {
                languageCode,
                prebuiltVoiceConfig: { voiceName: speakers[0].voiceName },
              },
            },
      };

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: prompt }] }],
        config,
      });
      console.log(response, 'response this.ai.models.generateContent');
      const data =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) {
        throw new HttpException(
          'No audio data returned',
          HttpStatus.BAD_REQUEST,
        );
      }

      const audioBuffer = Buffer.from(data, 'base64');

      // Construct filename and path
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const voices = speakers.map((s) => s.voiceName).join('_');
      const filename = `${dateStr}_${voices}_${languageCode}.wav`;

      const baseTypeDirName = 'TTS';

      const currentUserId = this.userId;

      // Construct the target directory: downloads/<audio|videos>/<provider>/<userId>
      const dir = path.join(
        this.downloadDir,
        baseTypeDirName,
        'voice',
        currentUserId,
      );

      const fullPath = path.join(dir, filename);
      console.log(fullPath, 'fullPath generateSpeech');
      // Save WAV file
      await this.saveWaveFile(filename, audioBuffer);

      return fullPath;
    } catch (error) {
      throw new HttpException(
        `Failed to generate TTS audio: ${error.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
