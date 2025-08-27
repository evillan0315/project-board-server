// full-stack/src/utils/json-fix/json-fix.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { RequestType } from '@prisma/client';

@Injectable()
export class JsonFixService {
  private readonly logger = new Logger(JsonFixService.name);

  constructor(private readonly geminiService: GoogleGeminiFileService) {}
  private extractJsonFromMarkdown(text: string): string {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }

    return text.trim();
  }
  /**
   * Attempts to fix invalid JSON using lightweight regex-based repairs.
   * This is a best-effort approach and may not cover all cases.
   */
  private localRepair(jsonString: string): string {
    let repaired = jsonString;

    // Common issues:
    // 1. Replace smart quotes with normal quotes
    repaired = repaired.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    // 2. Remove trailing commas before object/array end
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // 3. Ensure keys are quoted
    repaired = repaired.replace(/([{,]\s*)([A-Za-z0-9_]+)(\s*:)/g, '$1"$2"$3');

    // 4. Escape unescaped backslashes
    repaired = repaired.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

    return repaired;
  }

  /**
   * Fixes JSON locally, and if that fails, delegates to Gemini for repair.
   */
  async fixJson(jsonString: string, useGeminiFallback = true): Promise<any> {
    // Step 1: Try local repair
    try {
      const repaired = this.localRepair(jsonString);
      return JSON.parse(repaired);
    } catch (err) {
      this.logger.warn(`Local JSON repair failed: ${err.message}`);
    }

    if (!useGeminiFallback) {
      throw new BadRequestException(
        'Invalid JSON and Gemini fallback disabled.',
      );
    }

    // Step 2: Ask Gemini for repair
    try {
      const prompt = `The following string is supposed to be valid JSON, but it may be broken or malformed. Please return ONLY the corrected JSON, without extra commentary.

Input:
\`\`\`
${jsonString}
\`\`\``;

      const result = await this.geminiService.generateText(
        { prompt },
        RequestType.TEXT_ONLY,
      );

      // Try parsing Gemini's output
      const jsonMatch = this.extractJsonFromMarkdown(result);
      const jsonStringClean = jsonMatch ? jsonMatch[1] : result;
      this.logger.log(`JSON repair:`, jsonStringClean);
      return JSON.parse(jsonStringClean);
    } catch (err) {
      this.logger.error(`Gemini JSON repair failed: ${err.message}`);
      throw new InternalServerErrorException(
        'Unable to repair JSON using Gemini.',
      );
    }
  }
}
