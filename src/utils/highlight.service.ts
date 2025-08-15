import { Injectable } from '@nestjs/common';
import type { Highlighter, BundledLanguage, BundledTheme } from 'shiki';
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki';

@Injectable()
export class HighlightCodeService {
  private highlighterPromise: Promise<Highlighter>;

  constructor() {
    this.highlighterPromise = createHighlighter({
      langs: [
        'ts',
        'js',
        'bash',
        'python',
        'markdown',
      ] satisfies BundledLanguage[],
      themes: ['nord'] satisfies BundledTheme[],
    });
  }

  /**
   * Highlights code using the Shiki highlighter and returns the HTML representation.
   * @param code Source code string
   * @param lang Language ID (e.g. 'ts', 'js')
   * @returns HTML string with syntax highlighting
   */
  async highlightToHtml(
    code: string,
    lang: BundledLanguage = 'ts',
  ): Promise<string> {
    const highlighter = await this.highlighterPromise;
    return highlighter.codeToHtml(code, {
      lang,
      theme: 'nord',
    });
  }

  /**
   * Highlights code and returns plain text with ANSI color codes (useful for terminals).
   * @param code Source code string
   * @param lang Language ID (e.g. 'ts', 'js')
   * @returns Array of strings with ANSI color codes
   */
  async highlightToAnsi(
    code: string,
    lang: BundledLanguage = 'ts',
  ): Promise<string[]> {
    const highlighter = await this.highlighterPromise;
    const { tokens } = highlighter.codeToTokens(code, {
      lang,
      theme: 'nord',
    });

    return tokens.map(
      (line) =>
        line
          .map((token) => {
            const color = token.color ?? '#ffffff';
            const [r, g, b] = this.hexToRgb(color);
            return `\x1b[38;2;${r};${g};${b}m${token.content}`;
          })
          .join('') + '\x1b[0m',
    );
  }

  /**
   * Utility: Converts hex color to RGB tuple.
   */
  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
}
