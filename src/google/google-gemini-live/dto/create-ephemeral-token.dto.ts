export class CreateEphemeralTokenQueryDto {
  /** Optional override for token single-use limit. Defaults to 1. */
  uses?: number = 1;

  /** Expiry in minutes from now (default 30). */
  expireMinutes?: number = 30;

  /** Optional model to constrain Live Connect. */
  model?: string = 'gemini-2.0-flash-live-001';

  /** Optional temperature (server may ignore if not applicable). */
  temperature?: number = 0.7;

  /** Optional response modalities, defaults to TEXT only. */
  responseModalities?: Array<'TEXT' | 'AUDIO' | 'TOOLS'> = ['TEXT'];
}

export class EphemeralTokenResponseDto {
  /** Full token resource name (pass this to your client). */
  tokenName!: string; // e.g. "authTokens/ephemeral/XYZ..."

  /** RFC3339 expiration time for convenience. */
  expireTime!: string;
}
