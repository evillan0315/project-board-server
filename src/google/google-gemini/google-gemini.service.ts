import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GenerateDocDto } from './dto/generate-doc.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { OptimizeCodeDto } from './dto/optimize-code.dto';
import { AnalyzeCodeDto } from './dto/analyze-code.dto';
import { RepairCodeDto } from './dto/repair-code.dto';

import { OutputFormat } from './output-format.enum';

@Injectable()
export class GoogleGeminiService {
  private readonly apiEndpoint: string;

  constructor(private readonly httpService: HttpService) {
    this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GOOGLE_GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
  }

  // --- Optimize Code ---
  async optimizeCode(dto: OptimizeCodeDto): Promise<string> {
    const { codeSnippet, language, output = OutputFormat.Text } = dto;
    const prompt = `Optimize the following ${language || 'code'} for performance and readability. Provide only the improved version.\n\n${codeSnippet}`;

    return this.sendPrompt(prompt, output, 'Optimized Code', language);
  }

  // --- Analyze Code ---
  async analyzeCode(dto: AnalyzeCodeDto): Promise<string> {
    const { codeSnippet, language, output = OutputFormat.Text } = dto;
    const prompt = `Analyze the following ${language || 'code'} and describe any potential issues, improvements, or best practices:\n\n${codeSnippet}`;

    return this.sendPrompt(prompt, output, 'Code Analysis', language);
  }

  // --- Repair Code ---
  async repairCode(dto: RepairCodeDto): Promise<string> {
    const { codeSnippet, language, output = OutputFormat.Text } = dto;
    const prompt = `The following ${language || 'code'} has issues. Fix any syntax or logical errors and return the corrected version:\n\n${codeSnippet}`;

    return this.sendPrompt(prompt, output, 'Repaired Code', language);
  }

  // --- Shared prompt handler ---
  private async sendPrompt(
    prompt: string,
    output: OutputFormat,
    topic: string,
    language?: string,
  ): Promise<string> {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(this.apiEndpoint, body, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const resultText =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!resultText) {
        throw new HttpException(
          'Invalid response from Google Gemini API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      switch (output) {
        case OutputFormat.Json:
          return JSON.stringify({ result: resultText }, null, 2);
        case OutputFormat.Markdown:
          return `### ${topic}\n\n\`\`\`${language || ''}\n${resultText}\n\`\`\``;
        case OutputFormat.Html:
          return `<h3>${topic}</h3><pre><code>${resultText}</code></pre>`;
        case OutputFormat.Text:
        default:
          return `\n${resultText}\n`;
      }
    } catch (error) {
      throw new HttpException(
        `Google Gemini API request failed: ${error?.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async generateCode(dto: GenerateCodeDto): Promise<string> {
    const { prompt, language, topic, output = OutputFormat.Text } = dto;

    const fullPrompt = this.buildCodePrompt(prompt, language, topic, output);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
    };

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(this.apiEndpoint, body, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const generatedCode =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedCode) {
        throw new HttpException(
          'Invalid response from Google Gemini API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      switch (output) {
        case OutputFormat.Json:
          return JSON.stringify({ code: generatedCode }, null, 2);

        case OutputFormat.Markdown:
          return `### ${topic || 'Generated Code'}\n\n\`\`\`${language || ''}\n${generatedCode}\n\`\`\``;

        case OutputFormat.Html:
          return `<h3>${topic || 'Generated Code'}</h3><pre><code>${generatedCode}</code></pre>`;

        case OutputFormat.Text:
        default:
          return `\n${generatedCode}\n`;
      }
    } catch (error) {
      throw new HttpException(
        `Google Gemini API request failed: ${error?.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async generateCodeDocumentation(dto: GenerateDocDto): Promise<string> {
    const {
      codeSnippet,
      language,
      topic,
      isComment = false,
      output = OutputFormat.Text,
    } = dto;
    const prompt = this.buildPrompt(
      codeSnippet,
      language,
      topic,
      isComment,
      output,
    );

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(this.apiEndpoint, body, {
          headers: {
            'Content-Type': 'application/json',
            // Optional: Use OAuth token instead of API key
            // Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      const generatedText =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedText) {
        throw new HttpException(
          'Invalid response from Google Gemini API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      switch (output) {
        case 'json':
          return JSON.stringify({ documentation: generatedText }, null, 2);

        case 'markdown':
          return `### ${topic || 'Documentation'}\n\n\`\`\`${language || ''}\n${generatedText}\n\`\`\``;

        case 'html':
          return `<h3>${topic || 'Documentation'}</h3><pre><code>${generatedText}</code></pre>`;

        case 'text':
        default:
          return `\n${generatedText}\n`;
      }
    } catch (error) {
      throw new HttpException(
        `Google Gemini API request failed: ${error?.message || error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private buildPrompt(
    codeSnippet: string,
    language?: string,
    topic?: string,
    isComment?: boolean,
    output?: OutputFormat,
  ): string {
    const langText = language ? ` in ${language}` : '';
    const topicText = topic ? ` related to ${topic}` : '';
    const commentText = isComment ? ' with inline comments' : '';

    let formatText = '';
    let returnText = ``;
    switch (output) {
      case OutputFormat.Markdown:
        formatText = 'Return the response as Markdown-formatted code.';
        returnText = `Generate a documentation for ${topicText} using ${language}:\n\n${codeSnippet}\n\n${formatText}`;
        break;
      case OutputFormat.Json:
        formatText = 'Respond with a JSON object containing the code.';
        returnText = `Generate comprehensive documentation${commentText}${langText}${topicText} for the following code:\n\n${codeSnippet}\n\n${formatText}`;
        break;
      case OutputFormat.Html:
        formatText = 'Respond with HTML formatted output.';
        returnText = `Generate comprehensive documentation${commentText}${langText}${topicText} for the following code:\n\n${codeSnippet}\n\n${formatText}`;
        break;
      case OutputFormat.Text:
      default:
        formatText = `Respond with plain ${language || 'text'} code only.`;
        returnText = `Generate comprehensive documentation${commentText}${langText}${topicText} for the following code:\n\n${codeSnippet}\n\n${formatText}`;
        break;
    }

    return returnText;
  }

  private buildCodePrompt(
    instruction: string,
    language?: string,
    topic?: string,
    output?: OutputFormat,
  ): string {
    const langText = language ? ` using ${language}` : '';
    const topicText = topic ? ` for ${topic}` : '';

    let formatText = '';
    switch (output) {
      case OutputFormat.Markdown:
        formatText = 'Return the response as Markdown-formatted code.';
        break;
      case OutputFormat.Json:
        formatText = 'Respond with a JSON object containing the code.';
        break;
      case OutputFormat.Html:
        formatText = 'Respond with HTML formatted output.';
        break;
      case OutputFormat.Text:
      default:
        formatText = `Respond with plain ${language || 'typescript'} code only.

    Include a commented src target directory where the code would be saved.

    Include a commented title and description for the code at the top.

    Use TailwindCSS for styling, design, and layout.

    Apply the following color scheme:

        Dark mode: bg-gray-950, text-gray-100, bg-sky-600 (secondary)

        Light mode: bg-gray-100, text-gray-900, bg-sky-950 (secondary)

    Provide a commented example usage in markdown at the bottom. This should include:

        A clear title

        A short description of how to implement the generated code

    All notes, explanations, and documentation should appear only in comments below the code block in markdown.

    Do not include any inline comments or notes inside the ${language} code itself.

    Ensure the code is clean, minimal, and production-ready.`;
        break;
    }

    return `Generate${langText} code${topicText}.\n\nInstruction: ${instruction}\n\n${formatText}`;
  }
}
