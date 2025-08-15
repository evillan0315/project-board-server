// File: src/code-extractor/code-extractor.service.ts
// Title: Code Extractor Service
// Description: Extracts TypeScript code blocks from markdown or file path and saves them to corresponding file paths.

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ExtractCodeDto } from './dto/extract-code.dto';

@Injectable()
export class CodeExtractorService {
  async extractAndSave(dto: ExtractCodeDto, basePath = 'src'): Promise<void> {
    const markdown = await this.resolveMarkdown(dto);
    const codeBlocks = this.extractCodeBlocks(markdown);

    for (const block of codeBlocks) {
      const filePath = this.extractFilePath(block.meta);
      if (!filePath) continue;

      const fullPath = path.join(basePath, filePath);
      await this.ensureDirectoryExists(fullPath);

      const cleanedCode = block.code.trimStart();
      await fs.writeFile(fullPath, cleanedCode, 'utf-8');
    }
  }

  private async resolveMarkdown(dto: ExtractCodeDto): Promise<string> {
    if (dto.markdown) {
      return dto.markdown;
    }

    if (dto.filePath) {
      try {
        const content = await fs.readFile(dto.filePath, 'utf-8');
        return content;
      } catch (err) {
        throw new InternalServerErrorException(
          `Failed to read file: ${dto.filePath}`,
        );
      }
    }

    throw new BadRequestException(
      'Either "filePath" or "markdown" must be provided.',
    );
  }

  private extractCodeBlocks(
    markdown: string,
  ): { meta: string; code: string }[] {
    const codeBlockRegex =
      /```typescript\s*\/\/ File: (.+?)\n\/\/[\s\S]*?\n([\s\S]*?)```/g;
    const matches: { meta: string; code: string }[] = [];

    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const [_, meta, code] = match;
      matches.push({ meta, code });
    }

    return matches;
  }

  private extractFilePath(meta: string): string | null {
    const normalized = meta.trim().replace(/^src[\/\\]/, '');
    return normalized || null;
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create directory ${dir}: ${err.message}`,
      );
    }
  }
}
