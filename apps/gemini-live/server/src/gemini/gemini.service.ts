import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Part, ChatSession } from '@google/generative-ai';
import {
  LiveConfigDto,
  LiveConnectOptionsDto,
  LiveMessageDto,
  LiveTurnResultDto,
} from './dto/gemini-live.dto';
import { InternalAudioChunk, LiveSession } from './interfaces/live-session.interface';
import { User } from '../types/user';
import { randomUUID } from 'crypto';

const DEFAULT_MODEL = 'gemini-1.5-flash-latest'; // Or 'gemini-1.0-pro-latest'
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity

@Injectable()
export class GeminiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private activeSessions = new Map<string, LiveSession>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      this.logger.error('GOOGLE_API_KEY is not set in environment variables.');
      throw new Error('Google API Key is missing.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.startSessionCleanup();
  }

  onModuleDestroy() {
    this.stopSessionCleanup();
    this.activeSessions.forEach((session) => this.endSession(session.sessionId));
  }

  private startSessionCleanup() {
    this.cleanupInterval = setInterval(() => this.cleanupInactiveSessions(), 30 * 1000); // Check every 30 seconds
    this.logger.log('Started inactive session cleanup service.');
  }

  private stopSessionCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Stopped inactive session cleanup service.');
    }
  }

  private cleanupInactiveSessions() {
    const now = Date.now();
    const sessionsToCleanup: string[] = [];
    this.activeSessions.forEach((session) => {
      if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
        sessionsToCleanup.push(session.sessionId);
      }
    });

    sessionsToCleanup.forEach((sessionId) => {
      this.logger.warn(`Cleaning up inactive session: ${sessionId}`);
      this.endSession(sessionId);
    });
  }

  /**
   * Starts a new Gemini Live session.
   */
  async startSession(
    user: User,
    options?: LiveConnectOptionsDto,
  ): Promise<{ sessionId: string; initialAiResponse?: LiveTurnResultDto }> {
    const sessionId = randomUUID();
    const modelName = options?.config?.model || DEFAULT_MODEL;
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
      history: [], // Start with empty history, build it with turns
    });

    const newSession: LiveSession = {
      sessionId,
      userId: user.id,
      model,
      chat,
      conversationHistory: [],
      pendingTextInputs: [],
      pendingAudioChunks: [],
      lastActivity: Date.now(),
      isProcessingTurn: false,
    };

    this.activeSessions.set(sessionId, newSession);
    this.logger.log(`Session ${sessionId} started for user ${user.id} with model ${modelName}.`);

    let initialAiResponse: LiveTurnResultDto | undefined;
    if (options?.initialText) {
      newSession.pendingTextInputs.push(options.initialText);
      // Do NOT process turn immediately here. The frontend explicitly calls processTurn.
      // This ensures the frontend has full control over when a turn is submitted.
    }

    return { sessionId, initialAiResponse };
  }

  /**
   * Retrieves an active session.
   */
  getSession(sessionId: string): LiveSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now(); // Update activity on access
    }
    return session;
  }

  /**
   * Adds a text input to the session's pending inputs.
   */
  addTextInput(sessionId: string, text: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    session.pendingTextInputs.push(text);
    this.logger.debug(`Text buffered for session ${sessionId}: "${text}"`);
    return true;
  }

  /**
   * Adds an audio chunk to the session's pending inputs.
   * Expects base64 encoded audio. Decodes to Buffer.
   */
  addAudioInput(sessionId: string, audioChunkBase64: string, mimeType: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    try {
      const buffer = Buffer.from(audioChunkBase64, 'base64');
      session.pendingAudioChunks.push({ data: buffer, mimeType });
      this.logger.debug(
        `Audio chunk buffered for session ${sessionId}: ${buffer.length} bytes, type ${mimeType}`,
      );
      return true;
    } catch (e) {
      this.logger.error(`Failed to decode audio chunk for session ${sessionId}: ${e.message}`);
      return false;
    }
  }

  /**
   * Processes all buffered inputs for the current turn and sends to Gemini.
   * Returns an async generator for streaming responses.
   */
  async *processTurn(sessionId: string): AsyncGenerator<LiveTurnResultDto, void, unknown> {
    const session = this.getSession(sessionId);
    if (!session) {
      this.logger.error(`Attempted to process turn for non-existent session ${sessionId}`);
      return;
    }
    if (session.isProcessingTurn) {
      this.logger.warn(`Session ${sessionId} is already processing a turn. Skipping.`);
      return;
    }

    session.isProcessingTurn = true;
    session.lastActivity = Date.now();

    // Accumulate all pending inputs for the current turn
    const currentTurnText = session.pendingTextInputs.splice(0).join(' ').trim();
    const currentTurnAudioChunks = session.pendingAudioChunks.splice(0); // Clear audio chunks

    if (!currentTurnText && currentTurnAudioChunks.length === 0) {
      this.logger.log(`No input to process for session ${sessionId}.`);
      session.isProcessingTurn = false;
      return;
    }

    const parts: Part[] = [];

    if (currentTurnAudioChunks.length > 0) {
      try {
        const audioPart = this.createAudioPartFromChunks(currentTurnAudioChunks);
        parts.push(audioPart);
        this.logger.log(
          `Prepared audio part for session ${sessionId}: ${audioPart.audio.data.length} bytes`,
        );
        session.conversationHistory.push({
          role: 'user',
          parts: [{ inlineData: audioPart.audio }], // Store in history as inlineData
        });
      } catch (e) {
        this.logger.error(`Error creating audio part for session ${sessionId}: ${e.message}`);
        // Fallback or skip audio for this turn
      }
    }

    if (currentTurnText) {
      parts.push({ text: currentTurnText });
      this.logger.log(`Prepared text part for session ${sessionId}: "${currentTurnText}"`);
      // Add to conversation history. Ensure roles alternate. If audio was added, this is part of the same user turn.
      if (parts.length === 1 && parts[0].text) {
        // Only text part
        session.conversationHistory.push({ role: 'user', parts: [{ text: currentTurnText }] });
      } else if (parts.length > 1 && parts[parts.length - 1].text) {
        // Text added after audio for same turn
        session.conversationHistory[session.conversationHistory.length - 1].parts.push({
          text: currentTurnText,
        });
      }
    }

    if (parts.length === 0) {
      this.logger.log(`No actual parts to send for session ${sessionId}.`);
      session.isProcessingTurn = false;
      return;
    }

    try {
      this.logger.log(`Sending content to Gemini for session ${sessionId}...`);
      // Use chat.sendMessageStream for turn-based interaction that includes history
      const result = await session.chat.sendMessageStream({ contents: [{ role: 'user', parts }] });

      let collectedText = '';
      const aiResponseHistoryParts: Part[] = [];

      for await (const chunk of result.stream) {
        const candidate = chunk.candidates[0];
        const deltaText = candidate?.content?.parts[0]?.text || '';
        collectedText += deltaText;

        if (deltaText) {
          aiResponseHistoryParts.push({ text: deltaText });
          const liveMessage: LiveMessageDto = {
            text: deltaText,
            serverContent: { turnComplete: false },
          };
          yield { messages: [liveMessage], texts: [deltaText], datas: [] };
        }
      }

      if (collectedText) {
        // After all chunks received, add the full AI response to history
        // Check if the last role was 'user'. If so, current response is 'model'.
        // If history is empty or last entry was model, add new model turn.
        const lastHistoryEntry =
          session.conversationHistory[session.conversationHistory.length - 1];
        if (lastHistoryEntry?.role === 'model') {
          lastHistoryEntry.parts.push(...aiResponseHistoryParts);
        } else {
          session.conversationHistory.push({
            role: 'model',
            parts: aiResponseHistoryParts,
          });
        }
      }

      // Signal turn complete after all parts have been sent
      yield {
        messages: [{ text: '', serverContent: { turnComplete: true } }],
        texts: [],
        datas: [],
      };

      this.logger.log(
        `Gemini turn complete for session ${sessionId}. Total AI text: ${collectedText.length} chars.`,
      );
    } catch (e) {
      this.logger.error(`Error during Gemini stream for session ${sessionId}: ${e.message}`);
      yield {
        messages: [
          {
            text: `Error processing your request: ${e.message}`,
            serverContent: { turnComplete: true },
          },
        ],
        texts: [],
        datas: [],
      };
    } finally {
      session.isProcessingTurn = false;
    }
  }

  /**
   * Creates an audio Part from accumulated raw PCM chunks.
   * Converts raw PCM (16kHz, 16-bit, mono) into a WAV format.
   */
  private createAudioPartFromChunks(chunks: InternalAudioChunk[]): Part {
    if (chunks.length === 0) {
      throw new Error('No audio chunks to process.');
    }

    // Assume all chunks are the same format (e.g., audio/pcm;rate=16000)
    // For this example, we'll assume 16-bit, 16kHz, mono PCM.
    const sampleRate = 16000;
    const bitsPerSample = 16;
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const totalAudioData = Buffer.concat(chunks.map((c) => c.data));
    const audioDataLength = totalAudioData.length;

    const header = Buffer.alloc(44); // WAV header is 44 bytes

    // RIFF chunk
    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(36 + audioDataLength, 4); // ChunkSize
    header.write('WAVE', 8); // Format

    // FMT subchunk
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

    // Data subchunk
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(audioDataLength, 40); // Subchunk2Size

    const fullWavBuffer = Buffer.concat([header, totalAudioData]);

    return {
      audio: { mimeType: 'audio/wav', data: fullWavBuffer.toString('base64') },
    };
  }

  /**
   * Ends a live session and cleans up resources.
   */
  endSession(sessionId: string): boolean {
    if (!this.activeSessions.has(sessionId)) {
      this.logger.warn(`Attempted to end non-existent session: ${sessionId}`);
      return false;
    }
    this.activeSessions.delete(sessionId);
    this.logger.log(`Session ${sessionId} ended.`);
    return true;
  }

  // Helper for logging all active sessions (for debugging)
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}
