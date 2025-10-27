/**
 * Represents a single speaker configuration for Text-to-Speech.
 */
export interface SpeakerDto {
  /**
   * The name of the speaker, used to reference them in the prompt.
   * @example 'Eddie'
   */
  speaker: string;
  /**
   * The specific voice name to use for this speaker.
   * e.g., 'Kore', 'Puck', 'en-US-Studio-F'
   * @example 'en-US-Studio-F'
   */
  voiceName: string;
}

/**
 * DTO for the TTS request to the backend.
 */
export interface TtsRequestDto {
  /**
   * The text prompt containing named speakers to be synthesized.
   * @example 'Eddie: Hello, world! Marionette: How are you?'
   */
  prompt: string;
  /**
   * An array of speaker configurations, mapping speaker names to voice names.
   */
  speakers: SpeakerDto[];
  /**
   * Optional language code for the speech synthesis (BCP-47 code).
   * @default 'en-US'
   * @example 'en-US'
   */
  languageCode?: string;
}
