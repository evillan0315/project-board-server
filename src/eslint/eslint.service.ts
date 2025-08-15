// src/eslint/eslint.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'; // Import InternalServerErrorException
import { ESLint } from 'eslint'; // Import ESLint class
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
  private async getEslintInstance(cwd?: string): Promise<ESLint> { // Make async because of dynamic import
    const resolvedCwd = cwd || process.cwd();
    this.logger.debug(`Initializing ESLint with cwd: ${resolvedCwd}`);

    // Construct the path to the flat config file
    const configFilePath = path.join(resolvedCwd, 'eslint.config.ts');

    let loadedConfig;
    try {
      // Dynamically import the flat config file
      // IMPORTANT: This requires Node.js to be able to import ES modules,
      // and for the .ts file to be transpiled or run with ts-node.
      // Make sure your NestJS project's package.json has "type": "module"
      // or you are using ts-node-esm or similar for development.
      this.logger.debug(`Attempting to load ESLint config from: ${configFilePath}`);
      const configModule = await import(configFilePath);
      loadedConfig = configModule.default; // Assuming it's a default export as in your example

      if (!Array.isArray(loadedConfig)) {
        throw new Error('ESLint config file must default export an array.');
      }
      this.logger.log(`Successfully loaded ESLint config from: ${configFilePath}`);

    } catch (error: any) {
      this.logger.error(`Failed to load ESLint config from ${configFilePath}: ${error.message}`, error.stack);
      // Fallback: If config fails to load, provide a basic ESLint instance or throw error.
      // For this example, we'll throw an error as a missing config is critical.
      throw new InternalServerErrorException(
        `Failed to load ESLint configuration from ${configFilePath}. Ensure it exists and is correctly structured: ${error.message}`
      );
    }

    return new ESLint({
      cwd: resolvedCwd,
      fix: true,
      //useEslintrc: false, // Set to false because we are providing an explicit overrideConfig
      baseConfig: loadedConfig, // Use the dynamically loaded flat configuration
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

  async lintCode(
    code: string,
    filePath?: string,
    cwd?: string,
  ): Promise<DiagnosticDto[]> {
    try {
      // AWAIT the getEslintInstance because it's now async
      const eslint = await this.getEslintInstance(cwd);

      const resolvedFilePath = filePath || this.determineFilePathFromContent(code);

      this.logger.debug(`Linting code for: ${resolvedFilePath} in CWD: ${cwd || 'default'}`);

      // Ensure that ESLint knows how to process the filePath if it's a .ts or .tsx file.
      // The `overrideConfig` loaded from `eslint.config.ts` should handle this via `files` array.
      const results = await eslint.lintText(code, { filePath: resolvedFilePath });
      
      const diagnostics: DiagnosticDto[] = [];

      for (const result of results) {
        for (const message of result.messages) {
          const from = this.getCharOffset(message.line, message.column, code);

          const to = (message.endLine !== undefined && message.endColumn !== undefined)
            ? this.getCharOffset(message.endLine, message.endColumn, code)
            : from + 1;

          const severity: Severity =
            message.severity === 1 ? 'warning' : 'error';

          const actions: DiagnosticDto['actions'] = [];
          if (message.fix) {
            actions.push({
              name: `Fix: ${message.ruleId || 'auto-fix'}`,
              apply: JSON.stringify({
                from: message.fix.range[0],
                to: message.fix.range[1],
                insert: message.fix.text,
              }),
            });
          }

          diagnostics.push({
            from,
            to,
            message: message.message,
            severity,
            source: message.ruleId || 'eslint',
            actions: actions.length > 0 ? actions : undefined,
          });
        }
      }

      this.logger.debug(`Found ${diagnostics.length} diagnostics.`);
      return diagnostics;
    } catch (error: any) {
      this.logger.error('Error during ESLint linting:', error.stack || error.message);
      // Re-throw if it's an InternalServerErrorException from config loading
      if (error instanceof InternalServerErrorException) {
          throw error;
      }
      // Otherwise, return a generic diagnostic for unexpected errors during linting
      return [{
        from: 0,
        to: code.length,
        message: `ESLint service error: ${error.message || 'Unknown error'}`,
        severity: 'error',
        source: 'eslint-service',
      }];
    }
  }

  private determineFilePathFromContent(code: string): string {
    if (code.includes('import ') || code.includes('export ') || code.includes('const ') || code.includes('let ')) {
      return 'temp.ts';
    }
    return 'temp.js';
  }
}

