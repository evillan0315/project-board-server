// FilePath: src/planner/llm.service.ts
// Title: LLMService extended with Google Gemini support
// Reason: Provide the same functionality as GoogleGeminiFileService for text and file prompts.
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import fetch from 'node-fetch';
import { FileChangeDto, GeneratedPlanDto } from './dto'; // Changed PlanDto to GeneratedPlanDto
import { FileAction, RequestType } from '@prisma/client';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { ScannedFileDto } from '@/file/dto/scan-file.dto';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openaiKey = process.env.OPENAI_API_KEY;
  private geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  private geminiModel = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
  private geminiBaseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';

  private static extractJsonFromMarkdown(text: string): string {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return text.trim();
  }

  /**
   * Generate a planning DTO using either OpenAI or Google Gemini depending on environment variables.
   */
  async generatePlan(llmInput: LlmInputDto): Promise<GeneratedPlanDto> {
    if (this.geminiKey) {
      return this.generatePlanWithGemini(llmInput);
    }
    if (this.openaiKey) {
      return this.generatePlanWithOpenAI(llmInput);
    }
    // fallback
    return this.mockPlan(llmInput);
  }

  /**
   * \u2705 Existing OpenAI logic preserved
   */
  private async generatePlanWithOpenAI(llmInput: LlmInputDto): Promise<GeneratedPlanDto> {
    const { userPrompt, projectStructure, relevantFiles, additionalInstructions, expectedOutputFormat } = llmInput;
    const promptMessages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: expectedOutputFormat },
      { role: 'user', content: userPrompt },
    ];

    if (projectStructure) {
      promptMessages.push({ role: 'user', content: `\nProject Structure:\n${projectStructure}` });
    }
    if (relevantFiles && relevantFiles.length > 0) {
      const filesContent = relevantFiles.map(
        (file: ScannedFileDto) => `\nFile: ${file.relativePath}\nContent:\n${file.content}`,
      ).join('\n');
      promptMessages.push({ role: 'user', content: `\nRelevant Files:\n${filesContent}` });
    }
    if (additionalInstructions) {
      promptMessages.push({ role: 'user', content: `\nAdditional Instructions:\n${additionalInstructions}` });
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: promptMessages,
      temperature: 0,
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify(body),
    });

    const j = await resp.json();
    const txt = j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.text;

    try {
      return JSON.parse(txt) as GeneratedPlanDto;
    } catch {
      return this.mockPlan(llmInput);
    }
  }

  /**
   * \u2705 New Google Gemini implementation
   */
  private async generatePlanWithGemini(llmInput: LlmInputDto): Promise<GeneratedPlanDto> {
    if (!this.geminiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_GEMINI_API_KEY is not configured.',
      );
    }

    const { userPrompt, projectStructure, relevantFiles, additionalInstructions, expectedOutputFormat } = llmInput;
    const parts: { text: string }[] = [
      { text: userPrompt },
    ];

    if (projectStructure) {
      parts.push({ text: `\nProject Structure:\n${projectStructure}` });
    }
    if (relevantFiles && relevantFiles.length > 0) {
      const filesContent = relevantFiles.map(
        (file: ScannedFileDto) => `\nFile: ${file.relativePath}\nContent:\n${file.content}`,
      ).join('\n');
      parts.push({ text: `\nRelevant Files:\n${filesContent}` });
    }
    if (additionalInstructions) {
      parts.push({ text: `\nAdditional Instructions:\n${additionalInstructions}` });
    }

    // Append the expected output format as a system instruction
    const systemInstructionContent = expectedOutputFormat;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: parts,
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstructionContent }],
      },
      generationConfig: {
        //maxOutputTokens: 2000,
        temperature: 0.1, // Set a lower temperature for more predictable JSON output
        responseMimeType: 'application/json', // Request JSON output directly
      },
    };

    const apiUrl = `${this.geminiBaseUrl}/${this.geminiModel}:generateContent?key=${this.geminiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Gemini API error: ${response.status} - ${error}`);
      throw new InternalServerErrorException(`Gemini API error: ${error}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];
    const responseParts = candidate?.content?.parts ?? [];
    const generatedText = responseParts.map((p: any) => p.text ?? '').join('');

    try {
      let planData: GeneratedPlanDto;
      // If responseMimeType is honored, generatedText might already be pure JSON
      // Otherwise, extract from markdown block
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        planData = JSON.parse(generatedText) as GeneratedPlanDto;
      } else {
        planData = JSON.parse(LlmService.extractJsonFromMarkdown(generatedText)) as GeneratedPlanDto;
      }

      planData.changes = planData.changes.map((c) => ({
        ...c,
        action: (FileAction as any)[(c.action as string).toUpperCase()],
      })) as FileChangeDto[];

      // Ensure summary, documentation, gitInstructions are present, even if empty
      planData.summary = planData.summary || 'No summary provided.';
      planData.documentation = planData.documentation || '';
      planData.gitInstructions = planData.gitInstructions || [];
      planData.thoughtProcess = planData.thoughtProcess || '';

      return planData;
    } catch (e) {
      this.logger.error(`Failed to parse Gemini response: ${e.message}. Raw response: ${generatedText}`);
      return this.mockPlan(llmInput);
    }
  }

  /**
   * \u2705 mock now uses Prisma.$Enums.FileAction values
   */
  mockPlan(llmInput: LlmInputDto): GeneratedPlanDto {
    if (llmInput.userPrompt.includes('add route')) {
      return {
        title: 'Add /ping route',
        summary: 'Adds ping function to hello.ts',
        thoughtProcess: 'Mock thought process for adding ping route.',
        documentation: '## Ping Route\nThis adds a basic /ping route for health checks.',
        gitInstructions: ['git add .', 'git commit -m \"feat: add ping route\"'],
        changes: [
          {
            filePath: 'fixture-repo/src/hello.ts',
            action: FileAction.MODIFY,
            newContent: `export function hello() {\n  return \"Hello world\";\n}\nexport function ping() {\n  return \"pong\";}`,
            reason: 'Add ping function',
          },
        ],
      };
    }
    if (llmInput.userPrompt.includes('add file')) {
      return {
        title: 'Add readme',
        summary: 'Adds README.md to fixture-repo',
        thoughtProcess: 'Mock thought process for adding README file.',
        documentation: '## README.md\nThis file documents the fixture repository.',
        gitInstructions: ['git add README.md', 'git commit -m \"docs: add README\"'],
        changes: [
          {
            filePath: 'fixture-repo/README.md',
            action: FileAction.ADD,
            newContent: '# Fixture Repo\nThis is a demo file.',
            reason: 'Add README',
          },
        ],
      };
    }
    return {
      title: 'No-op',
      summary: 'No changes',
      thoughtProcess: 'No changes were deemed necessary based on the prompt.',
      documentation: '',
      gitInstructions: [],
      changes: [],
    };
  }
}
