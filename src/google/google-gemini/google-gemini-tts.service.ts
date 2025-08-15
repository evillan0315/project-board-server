import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as wav from 'wav';
import * as fs from 'fs';
import * as path from 'path';

interface SpeakerVoiceInput {
  speaker: string;
  voiceName: string;
}

@Injectable()
export class GoogleGeminiTtsService {
  private readonly ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException(
        'GOOGLE_GEMINI_API_KEY not set',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async saveWaveFile(
    filename: string,
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
  ): Promise<void> {
    const dir = path.join(__dirname, '..', '..', 'tts', 'voice');
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

      const dir = path.join(__dirname, '..', '..', 'tts', 'voice');
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
