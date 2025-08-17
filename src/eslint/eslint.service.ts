import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ESLint } from 'eslint';
import { DiagnosticDto, Severity } from './dto/diagnostic.dto';
import * as path from 'path';

@Injectable()
export class EslintService {
  private readonly logger = new Logger(EslintService.name);

  constructor() {}

  /**
   * Returns a new ESLint instance configured for the specific request.
   * This allows dynamic `cwd` and loading of the `eslint.config.ts` file.
   * @param cwd The current working directory for ESLint to resolve configurations and find `eslint.config.ts`.
   * @returns Configured ESLint instance.
   */
  private async getEslintInstance(cwd?: string): Promise<ESLint> {
    const resolvedCwd = cwd || process.cwd();
    this.logger.debug(`Initializing ESLint with cwd: ${resolvedCwd}`);

    const configFilePath = path.join(resolvedCwd, 'eslint.config.ts');

    let loadedConfig;
    try {
      this.logger.debug(`Attempting to load ESLint config from: ${configFilePath}`);
      // Dynamically import the flat config file
      // This requires Node.js to be able to import ES modules.
      const configModule = await import(configFilePath);
      loadedConfig = configModule.default;

      if (!Array.isArray(loadedConfig)) {
        throw new Error('ESLint config file must default export an array.');
      }
      this.logger.log(`Successfully loaded ESLint config from: ${configFilePath}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to load ESLint config from ${configFilePath}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to load ESLint configuration from ${configFilePath}. Ensure it exists and is correctly structured: ${error.message}`,
      );
    }

    return new ESLint({
      cwd: resolvedCwd,
      fix: true,
      overrideConfig: loadedConfig,
    });
  }

  /**
   * Converts ESLint 1-indexed line/column to CodeMirror 0-indexed character offset.
   * Note: This is crucial for correctly mapping diagnostics.
   * @param line 1-indexed line number
   * @param column 1-indexed column number
   * @param code The full code string
   * @returns 0-indexed character offset
   */
  private getCharOffset(line: number, column: number, code: string): number {
    let offset = 0;
    const lines = code.split('\n');
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for the newline character
    }
    return offset + (column - 1); // column is 1-indexed, convert to 0-indexed
  }

  /**
   * Processes ESLint lint results into a DiagnosticDto array.
   * @param results ESLint lint results.
   * @returns Array of DiagnosticDto.
   */
  private processEslintResults(results: ESLint.LintResult[]): Record<string, DiagnosticDto[]> {
    const allDiagnostics: Record<string, DiagnosticDto[]> = {};

    for (const result of results) {
      const fileDiagnostics: DiagnosticDto[] = [];
      const codeContent = result.source; // ESLint result includes source if available

      for (const message of result.messages) {
        // Fallback to 0 if codeContent is not available, though it should be for accurate offsets
        const from =
          codeContent !== undefined && message.line !== undefined && message.column !== undefined
            ? this.getCharOffset(message.line, message.column, codeContent)
            : message.fix?.range[0] || 0;

        const to =
          codeContent !== undefined &&
          message.endLine !== undefined &&
          message.endColumn !== undefined
            ? this.getCharOffset(message.endLine, message.endColumn, codeContent)
            : message.fix?.range[1] || from + 1;

        const severity: Severity = message.severity === 1 ? 'warning' : 'error';

        const actions: DiagnosticDto['actions'] = [];
        if (message.fix) {
          actions.push({
            name: `Fix: ${message.ruleId || 'auto-fix'}`, // Name of the fix
            apply: JSON.stringify({
              // Range and insert text for the fix
              from: message.fix.range[0],
              to: message.fix.range[1],
              insert: message.fix.text,
            }),
          });
        }

        fileDiagnostics.push({
          from,
          to,
          message: message.message,
          severity,
          source: message.ruleId || 'eslint',
          actions: actions.length > 0 ? actions : undefined,
        });
      }
      allDiagnostics[result.filePath] = fileDiagnostics;
    }
    return allDiagnostics;
  }

  async lintCode(code: string, filePath?: string, cwd?: string): Promise<DiagnosticDto[]> {
    try {
      const eslint = await this.getEslintInstance(cwd);

      const resolvedFilePath = filePath || this.determineFilePathFromContent(code);

      this.logger.debug(`Linting code for: ${resolvedFilePath} in CWD: ${cwd || 'default'}`);

      const results = await eslint.lintText(code, {
        filePath: resolvedFilePath,
      });

      // lintText returns an array with a single result for the given code
      return this.processEslintResults(results)[resolvedFilePath] || [];
    } catch (error: any) {
      this.logger.error('Error during ESLint linting:', error.stack || error.message);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      return [
        {
          from: 0,
          to: code.length,
          message: `ESLint service error: ${error.message || 'Unknown error'}`, // Fallback message
          severity: 'error',
          source: 'eslint-service',
        },
      ];
    }
  }

  async lintFiles(
    files: { code: string; filePath: string }[],
    cwd?: string,
  ): Promise<Record<string, DiagnosticDto[]>> {
    try {
      const eslint = await this.getEslintInstance(cwd);
      const allResults: ESLint.LintResult[] = [];

      for (const file of files) {
        this.logger.debug(`Linting file: ${file.filePath} in CWD: ${cwd || 'default'}`);
        const results = await eslint.lintText(file.code, {
          filePath: file.filePath,
        });
        allResults.push(...results);
      }

      return this.processEslintResults(allResults);
    } catch (error: any) {
      this.logger.error(
        'Error during ESLint linting multiple files:',
        error.stack || error.message,
      );
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to lint multiple files: ${error.message || 'Unknown error'}`, // Re-throw for consistent error handling
      );
    }
  }

  async lintDirectory(
    directoryPath: string,
    cwd?: string,
  ): Promise<Record<string, DiagnosticDto[]>> {
    try {
      const eslint = await this.getEslintInstance(cwd);

      this.logger.debug(`Linting directory: ${directoryPath} in CWD: ${cwd || 'default'}`);
      // ESLint's lintFiles method takes an array of file/directory patterns
      const results = await eslint.lintFiles([directoryPath]);

      return this.processEslintResults(results);
    } catch (error: any) {
      this.logger.error('Error during ESLint linting directory:', error.stack || error.message);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to lint directory: ${error.message || 'Unknown error'}`, // Re-throw for consistent error handling
      );
    }
  }

  private determineFilePathFromContent(code: string): string {
    if (
      code.includes('import ') ||
      code.includes('export ') ||
      code.includes('const ') ||
      code.includes('let ')
    ) {
      return 'temp.ts';
    }
    return 'temp.js';
  }
}
