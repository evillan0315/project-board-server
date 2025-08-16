import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  LlmInputDto,
  LlmOutputDto,
  ProposedFileChangeDto,
  FileAction,
} from './dto';
import { ScannedFileDto, ScanFileDto } from '../file/dto/scan-file.dto';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { FileService } from '../file/file.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private readonly LOGS_DIR: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleGeminiFileService: GoogleGeminiFileService,
    private readonly fileService: FileService,
    private readonly moduleControlService: ModuleControlService,
    private readonly utilsService: UtilsService,
  ) {
    this.LOGS_DIR = path.join(process.cwd(), '.ai-editor-logs');
  }

  onModuleInit() {
    if (!this.moduleControlService.isModuleEnabled('LlmModule')) {
      this.logger.warn(
        'LlmModule is currently disabled via ModuleControlService. LLM operations will be restricted.',
      );
    }
  }

  private ensureLlmModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('LlmModule')) {
      throw new ForbiddenException(
        'LLM module is currently disabled. Cannot perform LLM operations.',
      );
    }
  }

  private async buildLLMPrompt(
    llmInput: LlmInputDto,
    projectRoot: string,
  ): Promise<string> {
    const formattedRelevantFiles = llmInput.relevantFiles
      .map((file) => {
        return `// File: ${file.relativePath}\n${file.content}`;
      })
      .join('\n\n');
    const prompt = `
      # AI Code Generation Request
      
      ## User Request
      \`\`\`text
      ${llmInput.userPrompt}
      \`\`\`
      
      ## Project Context
      ${llmInput.projectStructure}
      
      ### Relevant Files (for analysis)
      \`\`\`files
      ${formattedRelevantFiles}
      \`\`\`
      `;

    return prompt.trim();
  }

  /*private async saveRawLLMResponse(rawText: string, prompt: string): Promise<void> {
    try {
      await fs.mkdir(this.LOGS_DIR, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `llm-response-${timestamp}.json`;
      const filePath = path.join(this.LOGS_DIR, fileName);

      const logContent = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        rawLLMResponse: (() => {
          try {
            return JSON.parse(rawText);
          } catch {
            return rawText;
          }
        })(),
      };

      await fs.writeFile(filePath, JSON.stringify(logContent, null, 2), 'utf-8');
      this.logger.log(`📝 Saved raw LLM response to: ${path.relative(process.cwd(), filePath)}`);
    } catch (error: unknown) {
      this.logger.error(`❌ Error saving raw LLM response to file: ${(error as Error).message}`);
    }
  }*/

  private static repairJsonBadEscapes(jsonString: string): string {
    //return jsonString.replace(/\\"/g, '"');
    return jsonString;
  }

  private static extractJsonFromMarkdown(text: string): string {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }

    return text.trim();
  }

  async generateContent(
    llmInput: LlmInputDto,
    projectRoot: string,
  ): Promise<LlmOutputDto> {
    this.ensureLlmModuleEnabled();

    const relevantFiles = await this.fileService.scan(
      llmInput.scanPaths,
      projectRoot,
    );
    const fullPrompt = await this.buildLLMPrompt(
      { ...llmInput, relevantFiles },
      projectRoot,
    );
    const systemInstructionForLLM = `${llmInput.additionalInstructions}\n\n${llmInput.expectedOutputFormat}`;

    this.logger.log('\n--- Prompt sent to LLM ---');

    this.logger.log(`Prompt size: ${fullPrompt.length} characters.`);
    this.logger.log('--------------------------\n');

    try {
      const payload: GenerateTextDto = {
        prompt: fullPrompt,
        systemInstruction: systemInstructionForLLM,
      };

      const response = await this.googleGeminiFileService.generateText(payload);

      if (!response) {
        this.logger.error(`Google Gemini API Error (via NestJS)`);
        throw new InternalServerErrorException(
          `Failed to get response from Google Gemini API`,
        );
      }

      const rawText = response;

      this.logger.log(
        '\n--- Raw LLM Response (from Google Gemini via NestJS) ---',
      );
      this.logger.log(rawText);
      this.logger.log('--------------------------------------------------\n');

      let cleanedJsonString = LlmService.extractJsonFromMarkdown(rawText);

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(cleanedJsonString);
      } catch (jsonError: unknown) {
        this.logger.warn(
          'Warning: Initial JSON parsing failed. Attempting to repair bad escaped characters.',
        );
        try {
          const repairedJsonString =
            LlmService.repairJsonBadEscapes(cleanedJsonString);
          parsedResult = JSON.parse(repairedJsonString);
          this.logger.log('JSON parsing succeeded after repair.');
        } catch (repairError: unknown) {
          this.logger.error(
            'Error parsing LLM response as JSON even after repair attempt.',
          );
          this.logger.error('Raw LLM Response before cleaning:', rawText);
          this.logger.error('Cleaned JSON string attempt:', cleanedJsonString);
          this.logger.error(
            'Repaired JSON string attempt (which also failed):',
            (repairError as Error).message,
          );
          throw new InternalServerErrorException(
            `Invalid JSON response from LLM: ${(jsonError as Error).message}. Repair attempt failed: ${(repairError as Error).message}`,
          );
        }
      }

      let llmOutput: LlmOutputDto;

      if (Array.isArray(parsedResult)) {
        this.logger.warn(
          "LLM returned an array directly instead of the full LlmOutputDto object. Wrapping it as 'changes'.",
        );
        llmOutput = {
          changes: parsedResult as ProposedFileChangeDto[],
          summary: 'Changes proposed by AI (summary not provided by LLM).',
          thoughtProcess:
            'LLM returned only the changes array, so a default summary and thought process are provided.',
        };
      } else if (typeof parsedResult === 'object' && parsedResult !== null) {
        if (
          Array.isArray(parsedResult.changes) &&
          typeof parsedResult.summary === 'string'
        ) {
          llmOutput = parsedResult as LlmOutputDto;
        } else {
          this.logger.error(
            'Parsed LLM output object is missing expected "changes" array or "summary" string.',
          );
          this.logger.error(
            'Received object (stringified):',
            JSON.stringify(parsedResult, null, 2),
          );
          throw new InternalServerErrorException(
            'LLM response object missing expected "changes" array or "summary" string.',
          );
        }
      } else {
        this.logger.error(
          'Parsed LLM output is neither an array nor an object, or null:',
          typeof parsedResult,
          parsedResult,
        );
        throw new InternalServerErrorException(
          'Invalid top-level JSON structure from LLM. Expected an object or an array.',
        );
      }

      for (const change of llmOutput.changes) {
        if (
          !change.filePath ||
          !['add', 'modify', 'delete'].includes(change.action)
        ) {
          this.logger.error(
            `Invalid change object found: ${JSON.stringify(change)}. Missing filePath or invalid action.`,
          );
          throw new BadRequestException(
            `Invalid change object received from LLM: Missing filePath or invalid action.`,
          );
        }
        if (
          (change.action === FileAction.ADD ||
            change.action === FileAction.MODIFY) &&
          change.newContent !== undefined
        ) {
          try {
            const detectedLanguage = this.utilsService.detectLanguage(
              change.filePath,
            );
            if (detectedLanguage) {
              change.newContent = await this.utilsService.formatCode(
                change.newContent!,
                detectedLanguage,
              );
            } else {
              this.logger.warn(
                `Could not detect language for file: ${change.filePath}. Skipping formatting.`,
              );
            }
          } catch (formatError) {
            this.logger.error(
              `Failed to format content for file ${change.filePath}: ${(formatError as Error).message}`,
            );
            // Optionally, re-throw or handle more gracefully if formatting is critical
          }
        } else if (
          (change.action === FileAction.ADD ||
            change.action === FileAction.MODIFY) &&
          change.newContent === undefined
        ) {
          this.logger.warn(
            `Warning: Change for ${change.filePath} (action: ${change.action}) has undefined newContent. This might be an issue and could lead to empty files.`,
          );
        }
      }

      return llmOutput;
    } catch (error: unknown) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error(
        `Error calling LLM (via GoogleGeminiFileService): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to get response from LLM: ${(error as Error).message}`,
      );
    }
  }
}
