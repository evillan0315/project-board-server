import { Logger } from 'fastify';
import nodeFetch from 'node-fetch';

import { FileChangeDto, CreatePlannerDto as PlanDto, LlmInputDto, ScannedFileDto } from './dto';
import { FileAction } from '../prisma/prisma.service';
import { CustomError } from '../common/errors';
import { ConfigService } from '../config';

export class LlmService {
  private readonly logger: Logger;
  private openaiKey: string | undefined;
  private geminiKey: string | undefined;
  private geminiModel: string;
  private geminiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger({ level: 'info' });
    this.openaiKey = this.configService.get('OPENAI_API_KEY');
    this.geminiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');
    this.geminiModel = this.configService.get('GOOGLE_GEMINI_MODEL') || 'gemini-1.5-flash';
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  private static extractJsonFromMarkdown(text: string): string {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return text.trim();
  }

  async generatePlan(llmInput: LlmInputDto): Promise<PlanDto> {
    if (this.geminiKey) {
      return this.generatePlanWithGemini(llmInput);
    }
    if (this.openaiKey) {
      return this.generatePlanWithOpenAI(llmInput);
    }
    return this.mockPlan(llmInput);
  }

  private async generatePlanWithOpenAI(llmInput: LlmInputDto): Promise<PlanDto> {
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

    const resp = await nodeFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify(body),
    });

    const j: any = await resp.json();
    const txt = j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.text;

    try {
      return JSON.parse(txt) as PlanDto;
    } catch (e: any) {
      this.logger.error(`Failed to parse OpenAI response: ${e.message}`);
      return this.mockPlan(llmInput);
    }
  }

  private async generatePlanWithGemini(llmInput: LlmInputDto): Promise<PlanDto> {
    if (!this.geminiKey) {
      throw new CustomError(
        'GOOGLE_GEMINI_API_KEY is not configured.',
        500,
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

    const payload = {
      contents: [
        {
          role: 'user',
          parts: parts,
        },
      ],
      systemInstruction: {
        parts: [{ text: expectedOutputFormat }],
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
      },
    };

    const apiUrl = `${this.geminiBaseUrl}/${this.geminiModel}:generateContent?key=${this.geminiKey}`;
    const response = await nodeFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Gemini API error: ${response.status} - ${error}`);
      throw new CustomError(`Gemini API error: ${error}`, response.status);
    }

    const result: any = await response.json();
    const candidate = result.candidates?.[0];
    const responseParts = candidate?.content?.parts ?? [];
    const generatedText = responseParts.map((p: any) => p.text ?? '').join('');

    try {
      const plan = JSON.parse(
        LlmService.extractJsonFromMarkdown(generatedText),
      ) as PlanDto;
      // Ensure FileAction enum values are valid
      plan.changes = plan.changes.map((c) => ({
        ...c,
        action: FileAction[c.action as keyof typeof FileAction], // Cast to enum member
      }));
      return plan;
    } catch (e: any) {
      this.logger.error(`Failed to parse Gemini response: ${e.message}`);
      return this.mockPlan(llmInput);
    }
  }

  mockPlan(llmInput: LlmInputDto): PlanDto {
    if (llmInput.userPrompt.includes('add route')) {
      return {
        title: 'Add /ping route',
        summary: 'Adds ping function to hello.ts',
        changes: [
          {
            filePath: 'fixture-repo/src/hello.ts',
            action: FileAction.MODIFY,
            newContent: `export function hello() {\n  return "Hello world";\n}\nexport function ping() {\n  return "pong";}`,
            reason: 'Add ping function',
          },
        ],
      };
    }
    if (llmInput.userPrompt.includes('add file')) {
      return {
        title: 'Add readme',
        summary: 'Adds README.md to fixture-repo',
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
      changes: [],
    };
  }
}
