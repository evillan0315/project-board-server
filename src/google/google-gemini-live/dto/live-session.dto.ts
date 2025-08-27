// Minimal DTOs for the WebSocket gateway turn handling and inputs.
export enum LiveModality {
  TEXT = 'TEXT',
}

export class StartLiveSessionDto {
  /** Model to use, e.g., 'gemini-live-2.5-flash-preview' */
  model!: string;

  /** Response modalities. Only TEXT is used in this sample. */
  responseModalities: LiveModality[] = [LiveModality.TEXT];

  /** Optional generation parameters. */
  temperature?: number = 0.7;
}

export class ClientTextDto {
  /** Free-form text sent by the client for a turn. */
  text!: string;
}

export class AudioChunkDto {
  /** Base64-encoded audio payload. */
  data!: string;
  /** MIME type, e.g., 'audio/pcm;rate=16000' */
  mimeType!: string;
}

export interface LiveTurnMessage {
  text?: string;
  data?: string;
  serverContent?: { turnComplete?: boolean };
}

export class LiveTurnResultDto {
  /** Raw messages composing a single server turn. */
  turns!: LiveTurnMessage[];
}
