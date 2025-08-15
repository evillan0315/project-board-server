import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class JsDocToMarkdownService {
  /**
   * Extracts JSDoc comments from a TypeScript/TSX file.
   * @param filePath Absolute or relative path to the input file.
   * @returns A list of JSDoc blocks as strings.
   */
  private async extractJsDocBlocks(filePath: string): Promise<string[]> {
    const absPath = path.resolve(filePath);
    const fileContent = await fs.readFile(absPath, 'utf-8');
    const jsDocBlocks = fileContent.match(/\/\*\*\s*[\s\S]*?\*\//gm) || [];
    return jsDocBlocks;
  }

  /**
   * Parses a single JSDoc block into Markdown format, including code blocks.
   * @param block A JSDoc block string.
   * @returns Markdown-formatted string.
   */
  private parseJsDocToMarkdown(block: string): string {
    const lines = block
      .replace(/^\/\*\*\s*/, '')
      .replace(/\s*\*\/$/, '')
      .split('\n')
      .map((line) => line.trim().replace(/^\*\s?/, ''));

    let markdown = '';
    const paramLines: string[] = [];
    let returnLine = '';
    let exampleLines: string[] = [];
    let inExample = false;

    for (const line of lines) {
      if (line.startsWith('@param')) {
        paramLines.push(line.replace('@param ', ''));
      } else if (line.startsWith('@returns') || line.startsWith('@return')) {
        returnLine = line.replace(/@returns? /, '');
      } else if (line.startsWith('@example')) {
        inExample = true;
        exampleLines.push('```ts');
        const content = line.replace('@example', '').trim();
        if (content) exampleLines.push(content);
      } else if (inExample) {
        if (line.startsWith('@')) {
          // End example block if another tag starts
          exampleLines.push('```');
          inExample = false;
        } else {
          exampleLines.push(line);
        }
      } else if (line.startsWith('@')) {
        // Skip other tags
        continue;
      } else {
        markdown += `${line}\n`;
      }
    }

    if (inExample) {
      exampleLines.push('```');
    }

    if (paramLines.length > 0) {
      markdown += `\n**Parameters:**\n`;
      for (const param of paramLines) {
        const match = param.match(/^(\w+)\s+(.*)/);
        if (match) {
          const [, name, desc] = match;
          markdown += `- \`${name}\`: ${desc}\n`;
        } else {
          markdown += `- ${param}\n`;
        }
      }
    }

    if (returnLine) {
      markdown += `\n**Returns:**\n${returnLine}\n`;
    }

    if (exampleLines.length > 0) {
      markdown += `\n**Example:**\n${exampleLines.join('\n')}\n`;
    }

    return markdown.trim();
  }

  /**
   * Extracts and converts JSDoc comments to Markdown and returns the document content.
   * @param filePath Path to the source file.
   * @returns Markdown document string.
   */
  async generateMarkdownDoc(filePath: string): Promise<string> {
    const blocks = await this.extractJsDocBlocks(filePath);
    const sections = blocks.map((block) => this.parseJsDocToMarkdown(block));
    return (
      `# Documentation for ${path.basename(filePath)}\n\n` +
      sections.join('\n\n---\n\n')
    );
  }

  /**
   * Exports JSDoc comments to a Markdown file.
   * @param filePath Path to the input TypeScript/TSX file.
   * @param outputPath Path to write the output Markdown file.
   */
  async exportMarkdownDoc(filePath: string, outputPath: string): Promise<void> {
    const markdown = await this.generateMarkdownDoc(filePath);
    await fs.writeFile(path.resolve(outputPath), markdown, 'utf-8');
  }
}
