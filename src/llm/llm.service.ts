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
  LlmReportErrorDto,
} from './dto'; // Import LlmReportErrorDto
import { ScannedFileDto } from '../file/dto/scan-file.dto';
import { GenerateTextDto } from '../google/google-gemini/google-gemini-file/dto/generate-text.dto';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { FileService } from '../file/file.service';
import { UtilsService } from '../utils/utils.service';
import { JsonFixService } from '../utils/json-fix/json-fix.service';
import { RequestType } from '@prisma/client';
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
    private readonly jsonFixService: JsonFixService,
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
    scannedFiles: ScannedFileDto[], // Use the scanned files directly
    projectStructure: string,
  ): Promise<string> {
    // Map each file to a promise that resolves to its formatted string content
    const fileContentPromises = scannedFiles.map(async (file) => {
      let filePath = file.relativePath;
      if (llmInput.projectRoot) {
        filePath = `${llmInput.projectRoot}/${file.relativePath}`;
      }
      // No need for 'await' here, as the string interpolation is synchronous
      return `
      \`\`\`${this.utilsService.detectLanguage(file.relativePath)}
      // File: ${filePath}\n${file.content}
      \`\`\`
      `;
    });
    // Wait for all promises to resolve, then join the resulting array of strings
    const formattedRelevantFiles = (
      await Promise.all(fileContentPromises)
    ).join('\n\n');
    const prompt = `
# ${this.utilsService.truncateText(llmInput.userPrompt, 50)} - AI Code Generation Request
## User Request
${llmInput.userPrompt}\n\n
## Project Context
${projectStructure}\n\n
### Relevant Files (for analysis)
${formattedRelevantFiles}\n\n
`;
    return prompt.trim();
  }
  private async buildErrorReportPrompt(
    errorReport: LlmReportErrorDto,
    scannedFiles: ScannedFileDto[],
    projectStructure: string,
  ): Promise<string> {
    const fileContentPromises = scannedFiles.map(async (file) => {
      let filePath = file.relativePath;
      if (errorReport.projectRoot) {
        filePath = `${errorReport.projectRoot}/${file.relativePath}`;
      }
      return `// File: ${filePath}\n${file.content}`;
    });
    const formattedRelevantFiles = (
      await Promise.all(fileContentPromises)
    ).join('\n\n');
    let failedChangesDescription = '';
    if (
      errorReport.context?.failedChanges && // Added optional chaining
      errorReport.context.failedChanges.length > 0
    ) {
      failedChangesDescription =
        'The following changes were proposed and caused the error:\n';
      failedChangesDescription += errorReport.context.failedChanges
        .map(
          (change) =>
            `  - File: ${change.filePath}, Action: ${change.action}, Reason: ${change.reason || 'N/A'}\n${
              change.newContent
                ? '    Content:\n' +
                  change.newContent
                    .split('\n')
                    .map((line) => '    ' + line)
                    .join('\n')
                : ''
            }`,
        )
        .join('\n\n');
    }
    const prompt = `
# AI Error Report Analysis Request
## Error Details
The following error occurred after applying some changes or attempting an operation:
\`\`\`
${errorReport.errorDetails}
\`\`\`
## Project Context
${projectStructure}
## Original Request Context (leading to the error)
${errorReport.context?.originalUserPrompt ? `**Original User Prompt:**\n\`\`\`\n${errorReport.context.originalUserPrompt}\n\`\`\`\n` : ''}
${errorReport.context?.systemInstruction ? `**System Instruction used:**\n\`\`\`\n${errorReport.context.systemInstruction}\n\`\`\`\n` : ''}
${failedChangesDescription}
### Relevant Files (for analysis of the error)
${formattedRelevantFiles}
## Task for AI
Analyze the provided error details, the project context, and the original request context. Identify the root cause of the error. Then, propose a solution or set of changes to fix the problem.
**Expected Output Format:**
Please respond in a structured JSON format that adheres to the \`LlmOutputDto\` schema. If no specific file changes are needed, provide a detailed analysis and recommendations in the \`summary\` and \`thoughtProcess\` fields, and include an \`ANALYZE\` action for a dummy file like \`error-analysis.md\` with the explanation as content.
\`\`\`json
{
  "title": "Error Analysis and Proposed Fix",
  "summary": "Concise explanation of the error and proposed solution.",
  "thoughtProcess": "Detailed reasoning behind the analysis and recommended changes.",
  "changes": [
    {
      "filePath": "path/to/problematic/file.ts",
      "action": "repair",
      "newContent": "corrected content",
      "reason": "Fixing the identified issue."
    },
    // ... potentially other changes or an ANALYZE action
    {
      "filePath": "error-analysis.md",
      "action": "analyze",
      "newContent": "### Error Analysis\\n\\n...\\n\\n### Recommendations\\n\\n...",
      "reason": "Detailed analysis of the error and steps for resolution."
    }
  ]
}
\`\`\`
`;
    return prompt.trim();
  }
  private static repairJsonBadEscapes(jsonString: string): string {
    //return jsonString.replace(/\"/g, '"');
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
  async generateProjectStructure(
    rootPath: string,
    ignorePatterns: string[] = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'postgres',
      'downloads',
      'icons',
    ],
  ): Promise<string> {
    const walk = async (dir: string, depth = 0): Promise<string> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name)); // keep deterministic order
      const lines: string[] = [];
      for (const entry of entries) {
        // skip ignored directories
        if (ignorePatterns.some((pattern) => entry.name.includes(pattern))) {
          continue;
        }
        const indent = '  '.repeat(depth);
        lines.push(`${indent}- ${entry.name}`);
        if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name);
          const subTree = await walk(subDir, depth + 1);
          if (subTree.trim().length > 0) {
            lines.push(subTree);
          }
        }
      }
      return lines.join('\n');
    };
    try {
      const structure = await walk(rootPath, 0);
      return `\nProject Structure (root: ${path.basename(rootPath)})\n${structure}`;
    } catch (err) {
      this.logger.error(
        `Failed to generate project structure for ${rootPath}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Could not generate project structure: ${(err as Error).message}`,
      );
    }
  }
  async generateContent(llmInput: LlmInputDto): Promise<any> {
    this.ensureLlmModuleEnabled();
    const projectRoot = llmInput.projectRoot; // Get projectRoot from DTO
    const scanPaths = llmInput.scanPaths;
    // 1. Scan files based on the provided projectRoot and scanPaths
    const scannedFiles = await this.fileService.scan(
      scanPaths,
      projectRoot,
      false,
    ); // verbose false by default
    const projectStructure = await this.generateProjectStructure(projectRoot); // Generate project structure
    // 2. Build the LLM prompt with the dynamically scanned files and project structure
    const fullPrompt = await this.buildLLMPrompt(
      llmInput,
      scannedFiles,
      projectStructure,
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
      const response = await this.googleGeminiFileService.generateText(
        payload,
        llmInput.requestType || RequestType.LLM_GENERATION, // Use requestType from input, fallback to LLM_GENERATION
      );
      if (!response) {
        this.logger.error(`Google Gemini API Error (via NestJS)`);
        throw new InternalServerErrorException(
          `Failed to get response from Google Gemini API`,
        );
      } else {
        //let cleanedJsonString = LlmService.extractJsonFromMarkdown(response);
        return response;
      }
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
  async reportErrorToLlm(
    errorReport: LlmReportErrorDto,
  ): Promise<LlmOutputDto> {
    this.ensureLlmModuleEnabled();
    const projectRoot = errorReport.projectRoot;
    const scanPaths = errorReport.scanPaths || [];
    // Add original file paths from context to scan paths
    if (
      errorReport.context?.originalFilePaths && // FIX: Added optional chaining here
      errorReport.context.originalFilePaths.length > 0
    ) {
      scanPaths.push(...errorReport.context.originalFilePaths);
    }
    // Ensure unique paths
    const uniqueScanPaths = Array.from(new Set(scanPaths));
    // 1. Scan files based on the provided projectRoot and scanPaths
    const scannedFiles = await this.fileService.scan(
      uniqueScanPaths,
      projectRoot,
      false,
    );
    const projectStructure = await this.generateProjectStructure(projectRoot);
    // 2. Build the LLM prompt specifically for error reporting
    const fullPrompt = await this.buildErrorReportPrompt(
      errorReport,
      scannedFiles,
      projectStructure,
    );
    // Define the expected output format for error analysis, which is LlmOutputDto
    const systemInstructionForLLM = `
You are an expert AI assistant tasked with analyzing errors in codebases and providing solutions.
Your response MUST be a JSON object adhering to the LlmOutputDto schema, which includes 'title', 'summary', 'thoughtProcess', and 'changes'.
If you recommend file modifications, use 'add', 'modify', 'delete', or 'repair' actions.
If your primary output is an analysis or explanation without direct code changes, use the 'analyze' action for a file named 'error-analysis.md' and put your detailed analysis and recommendations in its 'newContent' field.
`;
    this.logger.log('\n--- Error Report Prompt sent to LLM ---');
    this.logger.log(`Prompt size: ${fullPrompt.length} characters.`);
    this.logger.log('--------------------------------------\n');
    try {
      const payload: GenerateTextDto = {
        prompt: fullPrompt,
        systemInstruction: systemInstructionForLLM,
      };
      const response = await this.googleGeminiFileService.generateText(
        payload,
        RequestType.LLM_GENERATION,
      );
      if (!response) {
        this.logger.error(
          `Google Gemini API Error (via NestJS) for error reporting`,
        );
        throw new InternalServerErrorException(
          `Failed to get response from Google Gemini API for error report`,
        );
      }
      let cleanedJsonString = LlmService.extractJsonFromMarkdown(response);
      return JSON.parse(cleanedJsonString) as LlmOutputDto;
    } catch (error: unknown) {
      this.logger.error(
        `Error calling LLM for error report (via GoogleGeminiFileService): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to get LLM analysis for error report: ${(error as Error).message}`,
      );
    }
  }
}
