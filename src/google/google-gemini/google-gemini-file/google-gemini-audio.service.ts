import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('geminiApiKey');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set in environment variables.');
      throw new InternalServerErrorException('Gemini API key is missing.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Converts a Buffer to a Generative Part for inline data.
   * @param data The audio file buffer.
   * @param mimeType The MIME type of the audio (e.g., 'audio/wav', 'audio/mpeg').
   * @returns A Part object suitable for the Gemini API.
   */
  private bufferToGenerativePart(data: Buffer, mimeType: string): Part {
    return {
      inlineData: {
        data: data.toString('base64'),
        mimeType,
      },
    };
  }

  /**
   * Transcribes audio using the Google Gemini API.
   * @param audioBuffer The audio file as a Buffer.
   * @param mimeType The MIME type of the audio (e.g., 'audio/wav', 'audio/mpeg').
   * @returns The transcribed text.
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      // Use a model that supports multimodal input (like gemini-1.5-flash or gemini-1.5-pro)
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      }); // [1]

      const audioPart = this.bufferToGenerativePart(audioBuffer, mimeType);

      // Send the audio part with a prompt to transcribe it.
      const result = await model.generateContent([
        audioPart,
        { text: 'Transcribe this audio.' }, // Specific prompt to get the transcription. [7]
      ]);

      const response = await result.response;
      const transcription = response.text();

      this.logger.log('Audio successfully transcribed by Gemini.');
      return transcription;
    } catch (error) {
      this.logger.error(
        `Error transcribing audio with Gemini: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to transcribe audio with Gemini.',
      );
    }
  }
}
