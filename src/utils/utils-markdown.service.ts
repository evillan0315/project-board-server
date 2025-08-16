import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { Root } from 'mdast';
import * as fs from 'fs/promises';
import * as path from 'path';
import { convert } from 'html-to-text';
import { execFile } from 'child_process'; // For Pandoc execution
import { promisify } from 'util'; // For promisifying execFile
import * as os from 'os'; // For temporary directory handling

// Promisify execFile for async/await usage
const execFilePromise = promisify(execFile);

@Injectable()
export class MarkdownUtilService implements OnModuleInit, OnModuleDestroy {
  private globalCssContent: string | null = null;
  private tempDir: string | null = null; // Dedicated temporary directory for this service

  /**
   * NestJS lifecycle hook: Called once the host module has been initialized.
   * Used here to create a dedicated temporary directory for conversions.
   */
  async onModuleInit() {
    await this.createTempDirectory();
  }

  /**
   * NestJS lifecycle hook: Called once the application is shutting down.
   * Used here to clean up the temporary directory created during initialization.
   */
  async onModuleDestroy() {
    if (this.tempDir) {
      try {
        await fs.rm(this.tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${this.tempDir}`);
      } catch (error) {
        console.warn(
          `Failed to clean up temporary directory ${this.tempDir}:`,
          error,
        );
      }
    }
  }

  /**
   * Creates a unique temporary directory for this service instance.
   * This directory will be used to store intermediate files for Pandoc conversions.
   * @private
   */
  private async createTempDirectory(): Promise<void> {
    if (!this.tempDir) {
      // Use process PID and current timestamp for a more robust unique directory name
      const uniqueId = `markdown-util-temp-${process.pid}-${Date.now()}`;
      this.tempDir = path.join(os.tmpdir(), uniqueId);
      try {
        await fs.mkdir(this.tempDir, { recursive: true });
        console.log(`Created temporary directory: ${this.tempDir}`);
      } catch (error) {
        console.error(
          `Failed to create temporary directory ${this.tempDir}:`,
          error,
        );
        // Re-throw to prevent service from starting if temp directory creation fails
        throw error;
      }
    }
  }

  /**
   * Converts Markdown content to plain text (human-readable).
   * @param markdown The Markdown string.
   * @returns The plain text string.
   */
  async markdownToPlainText(markdown: string): Promise<string> {
    const htmlFile = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown);

    return convert(String(htmlFile), {
      wordwrap: 120,
      selectors: [
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'img', format: 'skip' },
        {
          selector: 'pre',
          options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
        },
      ],
    }).trim();
  }

  /**
   * Converts Markdown content to a Markdown Abstract Syntax Tree (MDAST) in JSON format.
   * @param markdown The Markdown string.
   * @returns The MDAST Root object.
   */
  async markdownToJson(markdown: string): Promise<Root> {
    const processor = unified().use(remarkParse);
    const tree = processor.parse(markdown);
    return tree as Root;
  }

  /**
   * Converts a JSON MDAST (Abstract Syntax Tree) back to Markdown content.
   * @param ast The MDAST Root object.
   * @returns The Markdown string.
   */
  async jsonToMarkdown(ast: Root): Promise<string> {
    const processor = unified().use(remarkStringify);
    const markdown = processor.stringify(ast);
    return markdown;
  }

  /**
   * Converts Markdown content to HTML, embedding global CSS style.
   * @param markdown The Markdown string.
   * @returns The HTML string with embedded styles.
   */
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

  /**
   * Loads a global CSS file to be injected into the HTML output.
   * @private
   */
  private async loadGlobalCss(): Promise<void> {
    const cssPath = path.resolve(
      __dirname,
      '../../../assets/github-markdown-light.css',
    );
    try {
      this.globalCssContent = await fs.readFile(cssPath, 'utf8');
    } catch (error) {
      console.warn(`Failed to load global CSS from ${cssPath}:`, error);
      this.globalCssContent = ''; // Ensure it's not null if loading fails
    }
  }

  /**
   * Executes a Pandoc command to convert files from one format to another.
   * This is a private helper method for DOCX conversions.
   * @private
   * @param inputFilePath Path to the input file.
   * @param outputFilePath Path to the output file.
   * @param inputFormat Format of the input file (e.g., 'markdown', 'html').
   * @param outputFormat Format of the output file (e.g., 'docx').
   * @throws Error if Pandoc is not found or conversion fails.
   */
  private async executePandoc(
    inputFilePath: string,
    outputFilePath: string,
    inputFormat: string,
    outputFormat: string,
  ): Promise<void> {
    // Ensure the temporary directory is initialized before attempting conversions
    if (!this.tempDir) {
      throw new Error(
        'Temporary directory not initialized. MarkdownUtilService setup might have failed.',
      );
    }

    try {
      // Basic Pandoc command: -f <input_format> -t <output_format> -o <output_file> <input_file>
      // More complex options (e.g., --reference-doc for custom styles) can be added here.
      const args = [
        `-f`,
        inputFormat,
        `-t`,
        outputFormat,
        `-o`,
        outputFilePath,
        inputFilePath,
      ];

      const { stdout, stderr } = await execFilePromise('pandoc', args);

      if (stderr) {
        console.warn(`Pandoc stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`Pandoc stdout: ${stdout}`);
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(
          'Pandoc is not installed or not found in system PATH. ' +
            'Please install Pandoc (https://pandoc.org/installing.html) to enable DOCX conversions. ' +
            `Original system error: ${error.message}`,
        );
      }
      throw new Error(
        `Pandoc conversion failed: ${error.message}. Output: ${(error as any).stdout || ''} Error: ${(error as any).stderr || ''}`,
      );
    }
  }

  /**
   * Converts Markdown content to a DOCX (Microsoft Word Document) file.
   * This method relies on 'Pandoc' being installed and accessible in the system's PATH.
   * It supports only the modern '.docx' format, not the older '.doc' format.
   *
   * @param markdown The Markdown string to convert.
   * @param baseFileName Optional base name for the internal temporary files (without extension).
   *                     A unique ID will be used if not provided. The returned Buffer
   *                     is the file content, the caller is responsible for saving it
   *                     with the desired final name.
   * @returns A Promise that resolves to a Buffer containing the DOCX file content.
   * @throws Error if Pandoc is not installed, the temporary directory is not initialized,
   *              or the conversion fails.
   */
  async markdownToDocx(
    markdown: string,
    baseFileName?: string,
  ): Promise<Buffer> {
    if (!this.tempDir) {
      throw new Error(
        'Temporary directory not initialized. MarkdownUtilService setup might have failed.',
      );
    }

    // Generate unique file names for input and output within the temporary directory
    const uniqueId =
      baseFileName ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const inputFilePath = path.join(this.tempDir, `${uniqueId}.md`);
    const outputFilePath = path.join(this.tempDir, `${uniqueId}.docx`);

    try {
      // Write markdown content to a temporary .md file
      await fs.writeFile(inputFilePath, markdown, 'utf8');

      // Execute Pandoc for markdown to docx conversion
      await this.executePandoc(
        inputFilePath,
        outputFilePath,
        'markdown',
        'docx',
      );

      // Read the generated docx file into a Buffer
      const docxBuffer = await fs.readFile(outputFilePath);
      return docxBuffer;
    } finally {
      // Clean up temporary files, ignoring potential errors during cleanup
      await fs
        .rm(inputFilePath, { force: true })
        .catch((err) =>
          console.warn(`Failed to remove temp file ${inputFilePath}:`, err),
        );
      await fs
        .rm(outputFilePath, { force: true })
        .catch((err) =>
          console.warn(`Failed to remove temp file ${outputFilePath}:`, err),
        );
    }
  }

  /**
   * Converts HTML content to a DOCX (Microsoft Word Document) file.
   * This method relies on 'Pandoc' being installed and accessible in the system's PATH.
   * It supports only the modern '.docx' format, not the older '.doc' format.
   *
   * @param html The HTML string to convert.
   * @param baseFileName Optional base name for the internal temporary files (without extension).
   *                     A unique ID will be used if not provided. The returned Buffer
   *                     is the file content, the caller is responsible for saving it
   *                     with the desired final name.
   * @returns A Promise that resolves to a Buffer containing the DOCX file content.
   * @throws Error if Pandoc is not installed, the temporary directory is not initialized,
   *              or the conversion fails.
   */
  async htmlToDocx(html: string, baseFileName?: string): Promise<Buffer> {
    if (!this.tempDir) {
      throw new Error(
        'Temporary directory not initialized. MarkdownUtilService setup might have failed.',
      );
    }

    // Generate unique file names for input and output within the temporary directory
    const uniqueId =
      baseFileName ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const inputFilePath = path.join(this.tempDir, `${uniqueId}.html`);
    const outputFilePath = path.join(this.tempDir, `${uniqueId}.docx`);

    try {
      // Write HTML content to a temporary .html file
      await fs.writeFile(inputFilePath, html, 'utf8');

      // Execute Pandoc for html to docx conversion
      await this.executePandoc(inputFilePath, outputFilePath, 'html', 'docx');

      // Read the generated docx file into a Buffer
      const docxBuffer = await fs.readFile(outputFilePath);
      return docxBuffer;
    } finally {
      // Clean up temporary files, ignoring potential errors during cleanup
      await fs
        .rm(inputFilePath, { force: true })
        .catch((err) =>
          console.warn(`Failed to remove temp file ${inputFilePath}:`, err),
        );
      await fs
        .rm(outputFilePath, { force: true })
        .catch((err) =>
          console.warn(`Failed to remove temp file ${outputFilePath}:`, err),
        );
    }
  }
}
