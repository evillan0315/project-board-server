import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as potrace from 'potrace';
import * as fs from 'fs';
import * as path from 'path';
import { lookup as mimeLookup } from 'mime-types';
import * as dotenv from 'dotenv';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkStringify from 'remark-stringify';
import { Root } from 'mdast';
import * as prettier from 'prettier';

import { ConfigService } from '@nestjs/config';
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki';
import type { Highlighter, BundledLanguage } from 'shiki';
import { JsonFixService } from './json-fix.service';
const bundledLangKeys = Object.keys(bundledLanguages) as BundledLanguage[];
type LanguageMap = Record<string, string>;

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  private outputDir = path.resolve(process.cwd(), 'svg-outputs');
  private cssDir = path.resolve(process.cwd(), 'styles');
  private globalCssContent: string | null = null;
  private downloadDir = path.resolve(process.cwd(), 'downloads');
  private highlighterPromise: Promise<Highlighter>;

  private readonly EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    ejs: 'ejs',
    hbs: 'handlebars',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cs: 'csharp',
    rs: 'rust',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    txt: 'plaintext',
    go: 'go',
    php: 'php',
    vue: 'vue',
    svelte: 'svelte',
    sql: 'sql',

    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    m4a: 'audio',
    aac: 'audio',
    flac: 'audio',
    wma: 'audio',

    mp4: 'video',
    webm: 'video',
    ogv: 'video',
    avi: 'video',
    mov: 'video',
    mkv: 'video',
    flv: 'video',
    '3gp': 'video',
    '3g2': 'video',
    wmv: 'video',
  };

  private readonly MIME_LANGUAGE_MAP: Record<string, string> = {
    'application/json': 'json',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'javascript',
    'application/javascript': 'javascript',
    'application/x-typescript': 'typescript',
    'text/typescript': 'typescript',
    'text/markdown': 'markdown',
    'application/xml': 'xml',
    'text/x-python': 'python',
    'text/plain': 'plaintext',
    'application/x-sh': 'shell',
    'application/x-yaml': 'yaml',

    'audio/mpeg': 'audio',
    'audio/mp3': 'audio',
    'audio/wav': 'audio',
    'audio/x-wav': 'audio',
    'audio/webm': 'audio',
    'audio/ogg': 'audio',
    'audio/mp4': 'audio',
    'audio/x-m4a': 'audio',
    'audio/aac': 'audio',
    'audio/flac': 'audio',
    'audio/x-ms-wma': 'audio',

    'video/mp4': 'video',
    'video/webm': 'video',
    'video/ogg': 'video',
    'video/x-msvideo': 'video',
    'video/quicktime': 'video',
    'video/x-matroska': 'video',
    'video/x-flv': 'video',
    'video/3gpp': 'video',
    'video/3gpp2': 'video',
    'video/x-ms-wmv': 'video',
  };

  private readonly parserMap: Record<
    string,
    prettier.BuiltInParserName | string
  > = {
    javascript: 'babel',
    jsx: 'babel',
    js: 'babel',

    typescript: 'typescript',
    ts: 'typescript',
    tsx: 'typescript',

    json: 'json',
    html: 'html',
    ejs: 'html',
    handlebars: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    markdown: 'markdown',
    md: 'markdown',

    yaml: 'yaml',
    xml: 'xml',
  };

  constructor(private readonly jsonFixService: JsonFixService) {
    this.initializeDirectories();
    this.loadGlobalCss();

    const allLangs = Array.from(
      new Set(
        Object.values(this.EXTENSION_LANGUAGE_MAP)
          .concat(Object.values(this.MIME_LANGUAGE_MAP))
          .filter((lang): lang is BundledLanguage =>
            bundledLangKeys.includes(lang as BundledLanguage),
          ),
      ),
    );

    /* this.highlighterPromise = createHighlighter({
      langs: allLangs,
      themes: ['nord'],
    });*/
  }

  async highlightToHtml(
    code: string,
    lang: BundledLanguage = 'typescript',
  ): Promise<string> {
    const highlighter = await this.highlighterPromise;
    return highlighter.codeToHtml(code, {
      lang,
      theme: 'nord',
    });
  }

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

  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        `Failed to create output directory: ${this.outputDir}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to initialize file system utilities.',
      );
    }
  }

  private async loadGlobalCss(): Promise<void> {
    const cssFilePath = path.resolve(
      process.cwd(),
      `${this.cssDir}/global.css`,
    );
    try {
      this.globalCssContent = await fs.promises.readFile(cssFilePath, 'utf-8');
      this.logger.log('global.css loaded successfully.');
    } catch (error) {
      this.logger.error(
        `Failed to load global.css from ${cssFilePath}: ${error.message}`,
        error.stack,
      );
      this.globalCssContent = '';
    }
  }

  private getTempPngPath(originalPath: string): string {
    const fileName = path.basename(originalPath, path.extname(originalPath));
    return path.join(this.outputDir, `${fileName}-${Date.now()}-temp.png`);
  }

  parseEnvMap(mapString?: string): LanguageMap {
    const map: LanguageMap = {};
    if (!mapString) return map;

    for (const entry of mapString.split(';')) {
      const [key, value] = entry.split('=');
      if (key && value) {
        map[key.trim()] = value.trim();
      }
    }

    return map;
  }

  detectLanguage(filename: string, mimeType?: string): string | undefined {
    if (!filename) {
      return undefined;
    }

    const ext = path.extname(filename).toLowerCase().substring(1);
    if (ext && this.EXTENSION_LANGUAGE_MAP[ext]) {
      return this.EXTENSION_LANGUAGE_MAP[ext];
    }

    const detectedMime = mimeType || mimeLookup(filename);
    if (detectedMime) {
      const normalizedMime = detectedMime.split(';')[0].toLowerCase();
      if (this.MIME_LANGUAGE_MAP[normalizedMime]) {
        return this.MIME_LANGUAGE_MAP[normalizedMime];
      }
    }

    return undefined;
  }

  async formatCode(code: string, language: string): Promise<string> {
    const parser = this.parserMap[language];
    this.logger.warn(`format code language: ${language}`);
    if (!parser) {
      this.logger.warn(
        `No Prettier parser configured for language: ${language}`,
      );
      return code;
    }

    try {
      const prettierCode = await prettier.format(code, {
        parser: parser as prettier.BuiltInParserName,
        plugins: await this.loadPrettierPlugins(parser),
        singleQuote: true,
        trailingComma: 'all',
        semi: true,
        printWidth: 100,
      });
      return prettierCode;
    } catch (error) {
      this.logger.error(
        `Failed to format code for language "${language}" using parser "${parser}": ${error.message}`,
        error.stack,
      );
      return code;
    }
  }

  private async loadPrettierPlugins(parser: string) {
    const externalPlugins: Record<string, string[]> = {
      yaml: ['prettier-plugin-yaml'],
      xml: ['@prettier/plugin-xml'],
    };

    const requiredPlugins = externalPlugins[parser];
    if (!requiredPlugins || requiredPlugins.length === 0) {
      return [];
    }

    try {
      const importedPlugins = await Promise.allSettled(
        requiredPlugins.map((p) => import(p)),
      );

      return importedPlugins
        .filter((result) => result.status === 'fulfilled')
        .map(
          (result: PromiseFulfilledResult<any>) =>
            result.value.default || result.value,
        );
    } catch (error) {
      this.logger.error(
        `Failed to load Prettier plugins for parser ${parser}: ${error.message}`,
      );
      return [];
    }
  }

  async convertToSvg(
    imagePath: string,
    color: string,
    width?: number,
    height?: number,
  ): Promise<{ svg: string; filePath: string }> {
    let tempPngPath: string | undefined;
    try {
      if (!fs.existsSync(imagePath)) {
        throw new BadRequestException(
          `Input image file not found: ${imagePath}`,
        );
      }

      tempPngPath = this.getTempPngPath(imagePath);

      let sharpPipeline = sharp(imagePath);
      if (width && height) {
        sharpPipeline = sharpPipeline.resize(width, height);
      } else if (width) {
        sharpPipeline = sharpPipeline.resize(width);
      } else if (height) {
        sharpPipeline = sharpPipeline.resize(undefined, height);
      }

      await sharpPipeline.threshold(128).toFile(tempPngPath);

      const tracer = new potrace.Potrace({
        threshold: 128,
        color: color,
        optTolerance: 0.4,
        background: 'transparent',
      });

      const svg: string = await new Promise((resolve, reject) => {
        tracer.loadImage(
          tempPngPath,
          function (err: Error) {
            if (err) {
              this.logger.error(
                `Potrace loadImage failed: ${err.message}`,
                err.stack,
              );
              return reject(
                new InternalServerErrorException(
                  `Potrace failed to load image: ${err.message}`,
                ),
              );
            }
            resolve(this.getSVG());
          }.bind(tracer),
        );
      });

      const svgFilename = `svg-${Date.now()}.svg`;
      const svgPath = path.join(this.outputDir, svgFilename);
      await fs.promises.writeFile(svgPath, svg, 'utf-8');

      return { svg, filePath: svgPath };
    } catch (error) {
      this.logger.error(
        `Image to SVG conversion failed for file "${imagePath}": ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Image to SVG conversion failed: ${error.message}`,
      );
    } finally {
      if (tempPngPath && fs.existsSync(tempPngPath)) {
        try {
          await fs.promises.unlink(tempPngPath);
        } catch (unlinkError) {
          this.logger.warn(
            `Failed to delete temporary file: ${tempPngPath}. Error: ${unlinkError.message}`,
          );
        }
      }
    }
  }

  parseSqlToJson(sql: string): {
    type: string;
    table: string;
    columns: string[];
    where: string | null;
  } {
    const selectRegex = /SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i;
    const match = sql.match(selectRegex);

    if (!match) {
      throw new BadRequestException('Invalid SELECT SQL syntax');
    }

    const [, columns, table, where] = match;
    return {
      type: 'select',
      table,
      columns: columns.split(',').map((col) => col.trim()),
      where: where ? where.trim() : null,
    };
  }

  parseInsertSqlToJson(sql: string): {
    type: string;
    table: string;
    data: Record<string, string>;
  } {
    const insertRegex = /INSERT INTO (\w+)\s*\((.+)\)\s*VALUES\s*\((.+)\)/i;
    const match = sql.match(insertRegex);

    if (!match) {
      throw new BadRequestException('Invalid INSERT SQL syntax');
    }

    const [, table, columns, values] = match;

    const columnList = columns.split(',').map((c) => c.trim());
    const valueList = values
      .split(',')
      .map((v) => v.trim().replace(/^'|'$/g, ''))
      .map((v) => (v === 'NULL' ? null : v));

    if (columnList.length !== valueList.length) {
      throw new BadRequestException(
        'Column and value counts do not match in INSERT statement',
      );
    }

    const data: Record<string, string> = {};
    columnList.forEach((col, idx) => {
      data[col] = valueList[idx] !== null ? String(valueList[idx]) : 'NULL';
    });

    return {
      type: 'insert',
      table,
      data,
    };
  }

  jsonToInsertSql(input: {
    table: string;
    data: Record<string, string | number | boolean | null>;
  }): string {
    const { table, data } = input;
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data)
      .map((v) => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return v;
      })
      .join(', ');

    return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
  }

  capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  toKebabCase(text: string): string {
    return text
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  reverseString(text: string): string {
    return text.split('').reverse().join('');
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  extractMarkdownTitle(markdown: string): string | null {
    const match = markdown.match(/^#{1,2}\s+(.*)/m);
    return match ? match[1].trim() : null;
  }

  uniqueArray<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  timeAgo(ms: number): string {
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = Date.now();
    const date = new Date(now - ms);

    const seconds = Math.round((now - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.4375);
    const years = Math.round(days / 365.25);

    if (seconds < 10) {
      return 'just now';
    } else if (seconds < 60) {
      return formatter.format(-seconds, 'second');
    } else if (minutes < 60) {
      return formatter.format(-minutes, 'minute');
    } else if (hours < 24) {
      return formatter.format(-hours, 'hour');
    } else if (days < 30) {
      return formatter.format(-days, 'day');
    } else if (months < 12) {
      return formatter.format(-months, 'month');
    } else {
      return formatter.format(-years, 'year');
    }
  }

  toUnixSeconds(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date provided to toUnixSeconds');
    }
    return Math.floor(d.getTime() / 1000);
  }

  parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new BadRequestException(
        'Invalid duration format. Expected format: e.g., "1d", "3h", "15m", "30s".',
      );
    }

    const [_, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    switch (unit) {
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 's':
        return amount * 1000;
      default:
        throw new InternalServerErrorException(
          'Unknown time unit provided to parseDurationToMs.',
        );
    }
  }

  formatUnixTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  parseEnvToJsonString(content: string): Record<string, string> {
    return dotenv.parse(content);
  }

  async parseEnvFile(
    file?: Express.Multer.File,
    filepath?: string,
  ): Promise<{ filepath: string; data: Record<string, string> }> {
    if ((file && filepath) || (!file && !filepath)) {
      throw new BadRequestException(
        'Provide exactly one of either an uploaded file or a filepath.',
      );
    }

    let content: string;
    let sourcePath: string;

    if (file) {
      content = file.buffer.toString('utf-8');
      sourcePath = file.originalname;
    } else {
      const resolvedPath = path.resolve(filepath as string);
      try {
        content = await fs.promises.readFile(resolvedPath, 'utf-8');
        sourcePath = resolvedPath;
      } catch (err) {
        this.logger.error(
          `Failed to read file at path: ${resolvedPath}`,
          err.stack,
        );
        throw new BadRequestException(
          `Failed to read file at path: ${filepath}. Make sure it's accessible and correct. `,
        );
      }
    }

    try {
      const parsed = dotenv.parse(content);
      return { filepath: sourcePath, data: parsed };
    } catch (err) {
      this.logger.error(
        `Failed to parse .env file content: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(
        'Failed to parse .env file. Ensure it is a valid .env format.',
      );
    }
  }

  async markdownToJson(markdown: string): Promise<Root> {
    const processor = unified().use(remarkParse);
    const tree = processor.parse(markdown);
    return tree;
  }

  async jsonToMarkdown(ast: Root): Promise<string> {
    const processor = unified().use(remarkStringify);
    const markdown = processor.stringify(ast);
    return markdown;
  }

  async markdownToHtml(markdown: string): Promise<string> {
    if (this.globalCssContent === null) {
      await this.loadGlobalCss();
    }

    const file = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown);

    return `<style>${this.globalCssContent || ''}</style><div class="markdown-body">${String(file)}</div>`;
  }

  stripTripleBackticks(content: string): string {
    return content
      .trim()
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/```$/, '');
  }

  // Corrected removeComments function
  removeComments(code: string): string {
    return (
      code
        // 1. Remove block comments: /* ... */
        //    - Add missing closing / for the regex literal.
        //    - Add an empty string '' as the replacement value.
        //    - Add 'g' flag for global replacement.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 2. Remove single-line comments: // ...
        //    - This line was mostly correct, but now operates on a valid string.
        .replace(/\/\/.*$/gm, '')
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
    );
  }

  /**
   * Replaces all double quotes (") with single quotes (') in a given string.
   * This is useful for code formatting where single quotes are preferred.
   * @param code The input string, typically code content.
   * @returns The string with double quotes replaced by single quotes.
   */
  replaceDoubleQuotesWithSingle(code: string): string {
    return code;
  }
  async fixJson(code: string): Promise<string> {
    return await this.jsonFixService.fixJson(code, true);
  }

  getDirectory(filePath: string): string {
    return path.dirname(filePath);
  }
}
