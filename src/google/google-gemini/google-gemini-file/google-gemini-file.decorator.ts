import { SetMetadata } from '@nestjs/common';

export const GoogleGeminiFile = (...args: string[]) =>
  SetMetadata('google-gemini-file', args);
