import { Injectable } from '@nestjs/common';

@Injectable()
export class EncodingService {
  /**
   * Encodes the given code to a Base64 string.
   * @param code - The code to encode.
   * @returns The Base64-encoded string.
   */
  encodeToBase64(code: string): string {
    return Buffer.from(code, 'utf-8').toString('base64');
  }

  /**
   * Decodes the given Base64 string back to code.
   * @param base64 - The encoded Base64 string.
   * @returns The decoded string.
   */
  decodeFromBase64(base64: string): string {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * URL-encodes the given code string.
   * @param code - The code to encode.
   * @returns URL-encoded string.
   */
  encodeToURIComponent(code: string): string {
    return encodeURIComponent(code);
  }

  /**
   * Decodes a URL-encoded code string.
   * @param encoded - The URL-encoded string.
   * @returns Decoded string.
   */
  decodeFromURIComponent(encoded: string): string {
    return decodeURIComponent(encoded);
  }
}
