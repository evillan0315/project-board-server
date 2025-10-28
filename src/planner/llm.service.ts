// FilePath: src/planner/llm.service.ts
// Title: LLMService extended with Google Gemini support
// Reason: Provide the same functionality as GoogleGeminiFileService for text and file prompts.

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import fetch from 'node-fetch';
import { FileChangeDto, CreatePlannerDto as PlanDto } from './dto';
import { FileAction, RequestType } from '@prisma/client';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private openaiKey = process.env.OPENAI_API_KEY;
  private geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  private geminiModel = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';
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
  async generatePlan(prompt: string): Promise<PlanDto> {
    if (this.geminiKey) {
      return this.generatePlanWithGemini(prompt);
    }
    if (this.openaiKey) {
      return this.generatePlanWithOpenAI(prompt);
    }
    // fallback
    return this.mockPlan(prompt);
  }

  /**
   * ✅ Existing OpenAI logic preserved
   */
  private async generatePlanWithOpenAI(prompt: string): Promise<PlanDto> {
    const system = `You are an AI Planner. Return ONLY a JSON object matching: { title, summary, changes: [{filePath, action, newContent?, diff?, reason?}] }`;
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
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
      return JSON.parse(txt) as PlanDto;
    } catch {
      return this.mockPlan(prompt);
    }
  }

  /**
   * ✅ New Google Gemini implementation
   */
  private async generatePlanWithGemini(prompt: string): Promise<PlanDto> {
    if (!this.geminiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_GEMINI_API_KEY is not configured.',
      );
    }

    const systemInstruction = `You are an AI Planner. Return ONLY a JSON object matching:
{
  "title": string,
  "summary": string,
  "changes": [
    {
      "filePath": string,
      "action": "ADD" | "MODIFY" | "DELETE" | "REPAIR" | "ANALYZE" | "INSTALL" | "RUN",
      "newContent"?: string,
      "diff"?: string,
      "reason"?: string
    }
  ]
}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        //maxOutputTokens: 2000,
        //temperature: 0,
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
    const parts = candidate?.content?.parts ?? [];
    const generatedText = parts.map((p: any) => p.text ?? '').join('');
    console.log(
      LlmService.extractJsonFromMarkdown(generatedText),
      'generatedText',
    );

    try {
      // Ensure Prisma FileAction enum is used
      const plan = JSON.parse(
        LlmService.extractJsonFromMarkdown(generatedText),
      ) as PlanDto;
      plan.changes = plan.changes.map((c) => ({
        ...c,
        action: (FileAction as any)[c.action.toUpperCase()],
      })) as FileChangeDto[];
      return plan;
    } catch (e) {
      this.logger.error(`Failed to parse Gemini response: ${e.message}`);
      return this.mockPlan(prompt);
    }
  }

  /**
   * ✅ mock now uses Prisma.$Enums.FileAction values
   */
  mockPlan(prompt: string): PlanDto {
    if (prompt.includes('add route')) {
      return {
        title: 'Add /ping route',
        summary: 'Adds ping function to hello.ts',
        changes: [
          {
            filePath: 'fixture-repo/src/hello.ts',
            action: FileAction.MODIFY,
            newContent: `export function hello() {
  return "Hello world";
}

export function ping() {
  return "pong";
}`,
            reason: 'Add ping function',
          },
        ],
      };
    }

    if (prompt.includes('add file')) {
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
