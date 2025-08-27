import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import * as crypto from 'node:crypto';

import {
  LiveMessageDto,
  LiveTurnResultDto,
  LiveConnectOptionsDto,
  LiveAudioPayloadDto,
  LiveSessionHandleDto as PublicLiveSessionHandleDto,
} from './dto/gemini-live.dto';

import {
  CreateEphemeralTokenQueryDto,
  EphemeralTokenResponseDto,
} from './dto/create-ephemeral-token.dto';

// Internal augmentation of the public handle to carry SDK session + queue
type InternalLiveSessionHandle = PublicLiveSessionHandleDto & {
  sdkSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>>;
  responseQueue: LiveMessageDto[];
  sendText: (text: string) => Promise<void>;
  sendAudio: (payload: LiveAudioPayloadDto) => Promise<void>;
  waitForTurn: () => Promise<LiveTurnResultDto>;
  close: () => Promise<void>;
};

@Injectable()
export class GoogleGeminiLiveService {
  private readonly logger = new Logger(GoogleGeminiLiveService.name);

  private readonly GOOGLE_GEMINI_MODEL: string;
  private readonly GOOGLE_API_KEY_FOR_TOKEN_CREATION: string;

  private readonly sessions = new Map<string, InternalLiveSessionHandle>();
  private readonly genaiClient: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.GOOGLE_API_KEY_FOR_TOKEN_CREATION = this.config.get<string>(
      'GOOGLE_GEMINI_API_KEY',
    )!;
    this.GOOGLE_GEMINI_MODEL =
      this.config.get<string>('GOOGLE_GEMINI_LIVE_MODEL') ||
      'gemini-live-2.5-flash-preview';

    if (!this.GOOGLE_API_KEY_FOR_TOKEN_CREATION) {
      this.logger.error(
        'Missing GOOGLE_GEMINI_API_KEY env var. Ephemeral token creation will fail.',
      );
      throw new Error('Missing GOOGLE_GEMINI_API_KEY');
    }

    this.genaiClient = new GoogleGenAI({
      apiKey: this.GOOGLE_API_KEY_FOR_TOKEN_CREATION,
    });
  }

  /** Establish a realtime Live session via SDK using an ephemeral token. */
  async connect(
    options: LiveConnectOptionsDto = {},
  ): Promise<{ sessionId: string; handle: PublicLiveSessionHandleDto }> {
    const sessionId = crypto.randomUUID();
    const modelToUse = options.config?.model || this.GOOGLE_GEMINI_MODEL;

    const responseQueue: LiveMessageDto[] = [];

    // inside connect() just after `const responseQueue: LiveMessageDto[] = [];`

const waitMessage = async (): Promise<LiveMessageDto> => {
  while (true) {
    const msg = responseQueue.shift();
    if (msg) return msg;
    await new Promise((r) => setTimeout(r, 50));
  }
};

// Heuristic: finish the turn if no new messages arrive for this long *after* at least one model message.
const IDLE_END_MS = 800;
// Hard stop (safety net)
const HARD_TIMEOUT_MS = 15000;

const handleTurn = async (): Promise<LiveTurnResultDto> => {
  const messages: LiveMessageDto[] = [];
  const texts: string[] = [];
  const datas: any[] = [];

  let lastMsgAt = Date.now();
  let sawAnyModelOutput = false;
  let resolved = false;

  const hardTimeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      throw new Error('waitTurn timeout – no turnComplete received');
    }
  }, HARD_TIMEOUT_MS);

  const idleTicker = setInterval(() => {
    // End on silence if we already saw some model output
    if (!resolved && sawAnyModelOutput && Date.now() - lastMsgAt >= IDLE_END_MS) {
      resolved = true;
      clearTimeout(hardTimeout);
      clearInterval(idleTicker);
      // synthesize a turnComplete so downstream code stays the same
      messages.push({ serverContent: { turnComplete: true }, text: undefined });
    }
  }, 100);

  try {
    while (true) {
      const msg = await waitMessage();
      // optional: detailed logging
      this.logger.debug(`waitTurn received: ${JSON.stringify(msg)}`);

      lastMsgAt = Date.now();

      // collect
      messages.push(msg);
      if (msg.text) {
        texts.push(msg.text);
        sawAnyModelOutput = true;
      }
      if ((msg as any).data) datas.push((msg as any).data);

      // normalize different shapes that may indicate turn completion
      const m: any = msg as any;
      const turnComplete =
        m?.serverContent?.turnComplete === true ||
        m?.turnComplete === true ||
        m?.type === 'turnComplete' ||
        m?.event === 'turn_complete' ||
        m?.response?.completed === true;

      if (turnComplete) {
        resolved = true;
        clearTimeout(hardTimeout);
        clearInterval(idleTicker);
        break;
      }
    }

    return { messages, texts, datas };
  } catch (e) {
    clearTimeout(hardTimeout);
    clearInterval(idleTicker);
    throw e;
  }
};
    let sdkSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>>;
    try {
      sdkSession = await this.genaiClient.live.connect({
        model: modelToUse,
        config: { responseModalities: [Modality.TEXT, Modality.AUDIO] },
        callbacks: {
          onopen: () => this.logger.debug(`Live session ${sessionId} opened`),
          onmessage: (message: LiveServerMessage) => {
            this.logger.debug(`Live session onmessage`, message)
            // normalize a broad set of shapes from the SDK
            const m: any = message;
            const normalized: LiveMessageDto = {
              text: m.text ?? m.outputText ?? null,
              // keep data if present (e.g., audio bytes or inline chunks)
              data: m.data ?? m.outputData ?? null,
              serverContent: {
                turnComplete:
                  m?.serverContent?.turnComplete === true ||
                  m?.turnComplete === true ||
                  m?.type === 'turnComplete' ||
                  m?.event === 'turn_complete' ||
                  m?.response?.completed === true
                    ? true
                    : undefined,
              },
            };
            responseQueue.push(normalized);
          },
          onerror: (e: any) => {
            this.logger.error(
              `Live session ${sessionId} error: ${e?.message ?? e}`,
            );
            // push a synthetic turnComplete to unblock collectors
            responseQueue.push({
              text: `Error: ${e?.message ?? 'unknown'}`,
              serverContent: { turnComplete: true },
            } as LiveMessageDto);
          },
          onclose: (e: any) => {
            this.logger.debug(
              `Live session ${sessionId} closed: ${e?.reason ?? 'unknown'}`,
            );
            // also unblock on close
            responseQueue.push({
              serverContent: { turnComplete: true },
            } as LiveMessageDto);
          },
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to connect Live session: ${err?.message}`,
        err?.stack,
      );
      throw new InternalServerErrorException(
        `Failed to connect to Gemini Live: ${err?.message}`,
      );
    }

    const internalHandle: InternalLiveSessionHandle = {
      conversationHistory: [],
      pendingUserTexts: [],
      pendingAudioChunks: [],
      pendingAudioMimeType: null,

      sdkSession,
      responseQueue,

      sendText: async (text: string) => {
        await sdkSession.sendClientContent({
          turns: text,
          turnComplete: true,
        });
      },

      sendAudio: async (payload: LiveAudioPayloadDto) => {
        const base64 = Buffer.from(payload.data).toString('base64');
        await sdkSession.sendRealtimeInput({
          audio: { data: base64, mimeType: payload.mimeType },
        });
      },

      waitForTurn: async (): Promise<LiveTurnResultDto> => {
        return await handleTurn();
      },

      close: async () => {
        try {
          await sdkSession.close?.();
        } catch (_) {}
      },
    };

    this.sessions.set(sessionId, internalHandle);

    if (options.initialText) {
      await internalHandle.sendText(options.initialText);
    }

    return { sessionId, handle: internalHandle };
  }

  private getHandle(sessionId: string): InternalLiveSessionHandle {
    const h = this.sessions.get(sessionId);
    if (!h)
      throw new InternalServerErrorException('Invalid or expired sessionId');
    return h;
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    const h = this.getHandle(sessionId);
    await h.sendText(text);
  }

  async sendAudioChunks(
    sessionId: string,
    chunks: ArrayBuffer[],
    mimeType: string,
  ): Promise<void> {
    const h = this.getHandle(sessionId);
    for (const chunk of chunks) {
      await h.sendAudio({ data: new Uint8Array(chunk), mimeType });
    }
  }

  async waitTurn(sessionId: string): Promise<LiveTurnResultDto> {
    const h = this.getHandle(sessionId);
    this.logger.debug(`waitTurn ${sessionId}`);
    return await h.waitForTurn();
  }

  async close(sessionId: string): Promise<void> {
    const h = this.getHandle(sessionId);
    await h.close();
    this.sessions.delete(sessionId);
  }
}
