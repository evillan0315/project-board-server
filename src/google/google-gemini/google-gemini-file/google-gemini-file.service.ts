// full-stack/src/google/google-gemini/google-gemini-file/google-gemini-file.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  Scope,
  BadRequestException,
} from '@nestjs/common';
import {
  GenerateTextDto,
  GenerateImageBase64Dto,
  GenerateResumeDto,
  OptimizeResumeDto,
  EnhanceResumeDto,
  OptimizationResultDto,
  GenerateVideoDto,
  VideoGenerationResultDto,
} from './dto';

import { ModuleControlService } from '../../../module-control/module-control.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConversationService } from '../../../conversation/conversation.service';
import { RequestType, Prisma } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CreateJwtUserDto } from '../../../auth/dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { lookup as mimeLookup } from 'mime-types';
import { ConversationHistoryItemDto } from '../../../conversation/dto/conversation-history-item.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export interface GenerateFileInternalDto {
  prompt: string;
  systemInstruction?: string;
  conversationId?: string;
  base64Data: string;
  mimeType: string;
}

@Injectable({ scope: Scope.REQUEST })
export class GoogleGeminiFileService {
  private readonly logger = new Logger(GoogleGeminiFileService.name);
  private readonly GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  private readonly GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL;
  private readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  private readonly VEO_MODEL_NAME = 'veo-2.0-generate-001';
  private readonly VEO_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly POLLING_INTERVAL_MS = 10000;
  private readonly POLLING_TIMEOUT_MS = 900000;

  constructor(
    private readonly moduleControlService: ModuleControlService,
    private readonly prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
    private readonly conversationService: ConversationService,
  ) {
    if (!this.moduleControlService.isModuleEnabled('GoogleModule')) {
      this.logger.warn(
        'Gemini module is disabled according to ModuleControlService. API calls will be blocked.',
      );
    }
    // Removed the GEMINI_API_KEY check here, as we'll place more specific checks
    // directly in the methods that use it, especially for Veo calls.
    if (!this.GOOGLE_GEMINI_MODEL) {
      this.logger.error(
        'Missing GOOGLE_GEMINI_MODEL environment variable. Gemini functionality will be impaired.',
      );
    }
  }

  private get userId(): string {
    if (!this.request.user || !this.request.user.id) {
      throw new InternalServerErrorException(
        'User ID not found in request context. Authentication might be missing or misconfigured.',
      );
    }
    return this.request.user.id;
  }

  private async getConversationHistory(
    conversationId: string,
    paginationDto: PaginationDto = { page: 1, limit: 20 },
  ): Promise<PaginatedResponseDto<ConversationHistoryItemDto>> {
    return this.conversationService.getConversationHistory(
      conversationId,
      paginationDto,
    );
  }

  private async callGeminiApi(
    modelName: string,
    payload: any,
    conversationHistory?: ConversationHistoryItemDto[],
  ): Promise<any> {
    if (!this.moduleControlService.isModuleEnabled('GoogleModule')) {
      this.logger.warn(
        'Gemini API calls are disabled by ModuleControlService. Aborting API call.',
      );
      throw new InternalServerErrorException(
        'Gemini API functionality is currently disabled.',
      );
    }

    if (!this.GEMINI_API_KEY || !this.GOOGLE_GEMINI_MODEL) {
      throw new InternalServerErrorException(
        'Gemini API key or model name is not configured.',
      );
    }

    try {
      this.logger.debug(`Calling Gemini API for model: ${modelName}`);

      const apiUrl = `${this.GEMINI_API_URL}/${modelName}:generateContent?key=${this.GEMINI_API_KEY}`;

      if (conversationHistory && conversationHistory.length > 0) {
        const seen = new Set<string>();
        const uniqueHistory: Omit<ConversationHistoryItemDto, 'createdAt'>[] =
          [];

        for (const item of conversationHistory) {
          const key = JSON.stringify({ role: item.role, parts: item.parts });
          if (!seen.has(key)) {
            seen.add(key);
            const { createdAt, requestType, tokenCount, id,  ...rest } = item;

            uniqueHistory.push(rest);
          }
        }
        payload.contents = [...uniqueHistory, ...payload.contents];
      }

      this.logger.debug(`Gemini API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(
          `Gemini API error (${response.status}): ${JSON.stringify(errorData)}`,
          errorData,
        );
        throw new InternalServerErrorException(
          `Gemini API error: ${errorData.error?.message || 'Unknown API error'}`,
        );
      }

      const result = await response.json();

      if (result.candidates?.[0]?.content?.parts?.length > 0) {
        return result;
      } else {
        this.logger.warn(
          'Gemini API response structure unexpected or content missing. Raw response:',
          result,
        );
        throw new InternalServerErrorException(
          'No content found in Gemini API response.',
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(
        `Failed to connect to Gemini API: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to connect to Gemini API: ${error.message}`,
      );
    }
  }

  private async saveGeminiInteraction(
    currentUserId: string,
    prompt: string,
    modelName: string,
    requestType: RequestType,
    geminiApiResult: any,
    conversationId?: string,
    systemInstruction?: string,
    imageData?: string,
    fileMimeType?: string,
    fileData?: string,
  ): Promise<string> {
    const generatedText = geminiApiResult.candidates[0].content.parts[0].text;
    const geminiRequest = await this.prisma.geminiRequest.create({
      data: {
        userId: currentUserId,
        conversationId: conversationId,
        prompt: prompt,
        systemInstruction: systemInstruction,
        modelUsed: modelName,
        requestType: requestType,
        imageData: imageData,
        fileMimeType: fileMimeType,
        fileData: fileData,
      },
    });

    await this.prisma.geminiResponse.create({
      data: {
        requestId: geminiRequest.id,
        responseText: generatedText,
        finishReason: geminiApiResult.candidates[0].finishReason || null,
        safetyRatings: geminiApiResult.candidates[0].safetyRatings
          ? JSON.stringify(geminiApiResult.candidates[0].safetyRatings)
          : Prisma.JsonNull,
        tokenCount: geminiApiResult.usageMetadata?.totalTokenCount || null,
      },
    });

    return generatedText;
  }

  private async _saveVideoGenerationInteraction(
    currentUserId: string,
    prompt: string,
    modelName: string,
    requestType: RequestType,
    operationName: string,
    videoUri: string | null,
    conversationId?: string,
  ): Promise<void> {
    const geminiRequest = await this.prisma.geminiRequest.create({
      data: {
        userId: currentUserId,
        conversationId: conversationId,
        prompt: `Veo Video Generation: "${prompt}" (Operation: ${operationName})`,
        modelUsed: modelName,
        requestType: requestType,
      },
    });

    await this.prisma.geminiResponse.create({
      data: {
        requestId: geminiRequest.id,
        responseText: videoUri || `Video generation operation ${operationName} status pending or failed.`,
        finishReason: videoUri ? 'SUCCESS' : 'PENDING_OR_FAILED',
        tokenCount: null,
        safetyRatings: Prisma.JsonNull,
      },
    });

    this.logger.debug(`Video generation interaction saved for operation ${operationName}.`);
  }

  private async _performGeminiOperation<
    T extends {
      prompt: string;
      systemInstruction?: string;
      conversationId?: string;
    },
  >(options: {
    dto: T;
    requestType: RequestType;
    getContents: (dto: T) => { role: string; parts: any[] }[];
    saveOptions?: {
      imageData?: string;
      fileMimeType?: string;
      fileData?: string;
    };
    defaultSystemInstruction?: string;
    parseResult?: (generatedText: string) => any;
  }): Promise<string | OptimizationResultDto> {
    const {
      dto,
      requestType,
      getContents,
      saveOptions,
      defaultSystemInstruction,
      parseResult,
    } = options;
    const { prompt, systemInstruction, conversationId } = dto;
    const currentUserId = this.userId;
    const modelName = this.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';

    let effectiveConversationId = conversationId;
    if (!effectiveConversationId) {
      effectiveConversationId = uuidv4();
    }

    let conversationHistory: ConversationHistoryItemDto[] | undefined;
    if (conversationId) {
      const paginatedResult = await this.getConversationHistory(conversationId);
      conversationHistory = paginatedResult.data;
      if (!conversationHistory || conversationHistory.length === 0) {
        this.logger.debug(
          `No history found for conversation ID: ${effectiveConversationId}. Starting fresh.`,
        );
      }
    }

    const effectiveSystemInstruction =
      systemInstruction || defaultSystemInstruction;

    const payload: {
      contents: { role: string; parts: any[] }[];
      systemInstruction?: { parts: { text: string }[] };
    } = {
      contents: getContents(dto),
    };

    if (effectiveSystemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: effectiveSystemInstruction }],
      };
    }

    try {
      const geminiApiResult = await this.callGeminiApi(
        modelName,
        payload,
        conversationHistory,
      );

      const generatedText = geminiApiResult.candidates[0].content.parts[0].text;
      this.logger.debug(
        `Gemini API generatedText ${requestType}: ${JSON.stringify(generatedText, null, 2)}`,
      );
      await this.saveGeminiInteraction(
        currentUserId,
        prompt,
        modelName,
        requestType,
        geminiApiResult,
        effectiveConversationId,
        effectiveSystemInstruction,
        saveOptions?.imageData,
        saveOptions?.fileMimeType,
        saveOptions?.fileData,
      );

      if (parseResult) {
        return parseResult(generatedText);
      }

      return generatedText;
    } catch (error) {
      this.logger.error(
        `Error in Gemini operation [${requestType}] or saving response: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async generateText(
    generateTextDto: GenerateTextDto,
    requestType?: RequestType,
  ): Promise<string> {
    return this._performGeminiOperation({
      dto: generateTextDto,
      requestType: requestType || RequestType.TEXT_ONLY,
      getContents: (dto) => [{ role: 'user', parts: [{ text: dto.prompt }] }],
    }) as Promise<string>;
  }

  async generateTextWithBase64Image(
    generateImageBase64Dto: GenerateImageBase64Dto,
  ): Promise<string> {
    const { base64Image, mimeType } = generateImageBase64Dto;
    return this._performGeminiOperation({
      dto: generateImageBase64Dto,
      requestType: RequestType.TEXT_WITH_IMAGE,
      getContents: (dto) => [
        {
          role: 'user',
          parts: [
            { text: dto.prompt },
            {
              inlineData: {
                mime_type: dto.mimeType,
                data: dto.base64Image,
              },
            },
          ],
        },
      ],
      saveOptions: { imageData: base64Image, fileMimeType: mimeType },
    }) as Promise<string>;
  }

  async generateTextWithFile(
    prompt: string,
    file: Express.Multer.File,
    systemInstruction?: string,
    conversationId?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided for analysis.');
    }
    this.logger.debug(
      `generateTextWithFile called with conversationId: ${conversationId}, filename: ${file.originalname}`,
    );

    const base64Data = file.buffer.toString('base64');
    const fileName = file.originalname;
    const fileMimeType =
      file.mimetype || mimeLookup(fileName) || 'application/octet-stream';

    const dto: GenerateFileInternalDto = {
      prompt,
      systemInstruction,
      conversationId,
      base64Data,
      mimeType: fileMimeType,
    };

    return this._performGeminiOperation({
      dto: dto,
      requestType: RequestType.TEXT_WITH_FILE,
      getContents: (internalDto) => [
        {
          role: 'user',
          parts: [
            { text: internalDto.prompt },
            {
              inlineData: {
                mime_type: internalDto.mimeType,
                data: internalDto.base64Data,
              },
            },
          ],
        },
      ],
      saveOptions: { fileData: base64Data, fileMimeType: fileMimeType },
    }) as Promise<string>;
  }

  async generateResume(generateResumeDto: GenerateResumeDto): Promise<string> {
    const defaultSystemInstruction = `You are an expert resume writer. Generate a professional and comprehensive resume in Markdown format based on the user's requirements. Ensure proper headings, bullet points for experience/achievements, and appropriate sections (e.g., Summary, Experience, Education, Skills, Projects). Focus on clarity, conciseness, and impact. Do not include any introductory or concluding remarks outside the resume itself.

Follow this markdown format:
---
name: Alex Techpro
email: alex.techpro@example.com
phone: +1 (555) 987-6543
linkedin: linkedin.com/in/alex-techpro-senior-swe
github: github.com/alextechpro-dev
location: New York, NY
---

# Alex Techpro

## Summary

Highly accomplished Senior Software Engineer with **10 years of experience** designing, developing, and deploying robust, scalable, and high-performance full-stack applications. Proven expertise in **TypeScript, React, Node.js, and AWS**, with a strong focus on building critical systems in the **FinTech domain**. Adept at leading complex projects, optimizing system architecture, and delivering innovative solutions that drive business growth and operational efficiency. Seeking to leverage advanced technical skills and leadership capabilities to contribute to a forward-thinking FinTech organization.

## Experience

**Senior Software Engineer** | InnovateFin Solutions | New York, NY
January 2020 – Present

*   Led the design and implementation of a real-time trading platform using React, Node.js, and AWS Lambda, processing over **1 million transactions daily**.
*   Architected and developed microservices for financial data aggregation and analytics using TypeScript, Node.js, and AWS DynamoDB, ensuring high availability and fault tolerance.
*   Mentored junior engineers, conducted code reviews, and fostered best practices in CI/CD, testing, and system design within an Agile/Scrum environment.
*   Collaborated cross-functionally with product and quantitative analysts to translate complex financial requirements into technical specifications.
*   **Reduced transaction latency by 40%** (from 250ms to 150ms) by optimizing WebSocket communication and API Gateway configurations.
*   **Improved data processing efficiency by 30%** and **reduced cloud infrastructure costs by 20%** through refactoring legacy Node.js services to serverless AWS Lambda functions.
*   Developed and launched a new user-facing dashboard for portfolio management, **increasing user engagement by 25%** within the first 3 months.
*   Successfully led the migration of a monolithic payment processing system to a microservices architecture, **improving system scalability by 5x**.

**Software Engineer** | WealthFlow Technologies | New York, NY
July 2016 – December 2019

*   Developed and maintained critical components of a wealth management platform, focusing on client onboarding and investment tracking modules.
*   Built robust RESTful APIs using Node.js and Express.js, integrating with third-party financial services APIs (e.g., market data feeds, payment processors).
*   Implemented responsive and intuitive user interfaces with React and Redux, ensuring a seamless user experience for financial advisors and clients.
*   Participated in the design and implementation of PostgreSQL database schemas and optimized complex SQL queries for financial reporting.
*   Contributed to the development of a new client onboarding portal, **reducing manual processing time by 35%** and improving data accuracy.
*   Enhanced system monitoring and alerting with AWS CloudWatch, **decreasing incident response time by 20%** and improving system stability.
*   **Improved application performance by optimizing React component rendering** and state management, leading to a 15% faster page load time.
*   Played a key role in integrating a new payment gateway, enabling support for three additional payment methods and expanding market reach.

**Junior Software Engineer** | FinEdge Solutions | Boston, MA
June 2014 – June 2016

*   Developed frontend features for an internal CRM system using JavaScript (ES6) and early React.js, focusing on client relationship management in finance.
*   Assisted in backend development for data synchronization services using Node.js for financial record keeping.
*   Contributed to testing efforts, including unit and integration tests, ensuring data integrity for financial transactions.
*   Participated in daily stand-ups and sprint planning sessions within an Agile environment.
*   Implemented a new data visualization module, providing real-time insights into customer engagement and financial trends.
*   Automated routine data entry tasks using scripting, **saving approximately 5 hours of manual work per week**.
*   Successfully migrated legacy JavaScript components to a React-based framework, improving maintainability and development velocity.

## Education

**Master of Science in Computer Science** | Columbia University | New York, NY
September 2015 – May 2017
*   Specialization in Software Systems and Data Engineering

**Bachelor of Science in Computer Engineering** | Northeastern University | Boston, MA
September 2010 – May 2014
*   Graduated Magna Cum Laude
*   Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Database Management

## Skills

**Programming Languages:** TypeScript, JavaScript (ES6+), Python, SQL
**Frontend:** React.js, Redux, Next.js, HTML5, CSS3 (Sass/Less), Webpack, Vite
**Backend:** Node.js, Express.js, NestJS, RESTful APIs, GraphQL, Microservices, Serverless Architectures
**Cloud Platforms:** AWS (EC2, Lambda, S3, RDS, DynamoDB, SQS, SNS, API Gateway, CloudWatch, VPC, IAM, Cognito, ECS/EKS)
**Databases:** PostgreSQL, MongoDB, DynamoDB, Redis, MySQL
**DevOps & Tools:** Docker, Kubernetes (basic), Jenkins, CircleCI, GitHub Actions, Git, Jira, Confluence, Agile/Scrum
**Testing:** Jest, React Testing Library, Cypress, Mocha, Chai, Supertest
**FinTech Domain:** High-Frequency Trading Systems, Payment Processing, Market Data Systems, Regulatory Compliance (e.g., PCI DSS, GDPR concepts), Algorithmic Trading Concepts, Wealth Management Platforms, Quantitative Finance Principles
`;

    return this._performGeminiOperation({
      dto: generateResumeDto,
      requestType: RequestType.RESUME_GENERATION,
      getContents: (dto) => [{ role: 'user', parts: [{ text: dto.prompt }] }],
      defaultSystemInstruction: defaultSystemInstruction,
    }) as Promise<string>;
  }

  async optimizeResume(
    optimizeResumeDto: OptimizeResumeDto,
  ): Promise<OptimizationResultDto> {
    const defaultSystemInstruction = `You are an AI resume optimization expert. Your task is to analyze a given resume against a job description and provide actionable, specific suggestions to improve its alignment. Focus on:
- Keyword matching (hard skills, soft skills, industry terms)
- Quantifiable achievements and impact
- Use of strong action verbs
- Overall relevance and conciseness
- Identifying gaps or areas for improvement.

Return your response as a JSON object strictly adhering to the following TypeScript interface. Do NOT include any other text or formatting outside the JSON block.

interface OptimizationSuggestion {
  type: string; // e.g., "Keyword Match", "Action Verbs", "Quantifiable Achievements", "Relevance", "Formatting"
  recommendation: string; // A concise recommendation
  details?: string[]; // Specific points or examples from the resume/JD to support the recommendation
}

interface OptimizationResult {
  optimizationScore: number; // A score (e.g., out of 100) indicating alignment
  tailoredSummary: string; // A brief, overall summary of alignment and key takeaways
  suggestions: OptimizationSuggestion[]; // Array of detailed suggestions
  improvedResumeSection?: string; // Optional: A small, rewritten example section for demonstration
}

Ensure the JSON is perfectly parsable. If no specific suggestion for a category, omit it or provide an empty array.
`;
    const prompt = `Here is the resume:\n\n${optimizeResumeDto.resumeContent}\n\nHere is the job description:\n\n${optimizeResumeDto.jobDescription}\n\nBased on these, generate the optimization result in the specified JSON format.`;

    return this._performGeminiOperation({
      dto: { ...optimizeResumeDto, prompt: prompt },
      requestType: RequestType.RESUME_OPTIMIZATION,
      getContents: (dto) => [{ role: 'user', parts: [{ text: dto.prompt }] }],
      defaultSystemInstruction: defaultSystemInstruction,
      parseResult: (generatedText: string): OptimizationResultDto => {
        try {
          const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
          const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          this.logger.error(
            `Failed to parse Gemini JSON response for resume optimization: ${jsonError.message}`,
          );
          this.logger.error(
            `Raw Gemini response (optimization): ${generatedText}`,
          );
          throw new InternalServerErrorException(
            'Gemini returned an unparseable JSON response for resume optimization.',
          );
        }
      },
    }) as Promise<OptimizationResultDto>;
  }

  async enhanceResume(enhanceResumeDto: EnhanceResumeDto): Promise<string> {
    let defaultSystemInstruction = `You are an expert resume enhancer. Your goal is to rewrite or improve the provided resume content to be more impactful, concise, and professional. Focus on strong action verbs, quantifiable achievements, and clear communication. Do not add or remove factual information unless explicitly instructed. Provide only the enhanced text, with no additional commentary.`;
    if (enhanceResumeDto.sectionToEnhance) {
      defaultSystemInstruction += ` Specifically focus on enhancing the '${enhanceResumeDto.sectionToEnhance}' section.`;
    }
    if (enhanceResumeDto.enhancementGoal) {
      defaultSystemInstruction += ` The specific goal for enhancement is: '${enhanceResumeDto.enhancementGoal}'.`;
    }

    const prompt = enhanceResumeDto.sectionToEnhance
      ? `Enhance the '${enhanceResumeDto.sectionToEnhance}' section of the following resume. The original resume content is:\n\n${enhanceResumeDto.resumeContent}`
      : `Enhance the following resume content:\n\n${enhanceResumeDto.resumeContent}`;

    return this._performGeminiOperation({
      dto: { ...enhanceResumeDto, prompt: prompt },
      requestType: RequestType.RESUME_ENHANCEMENT,
      getContents: (dto) => [{ role: 'user', parts: [{ text: dto.prompt }] }],
      defaultSystemInstruction: defaultSystemInstruction,
    }) as Promise<string>;
  }


  private async _pollVideoOperation(operationName: string): Promise<any> {
    // Ensure API key is present before making the request
    if (!this.GEMINI_API_KEY) {
      throw new InternalServerErrorException('Gemini API key is not configured for video generation polling.');
    }

    const startTime = Date.now();
    while (Date.now() - startTime < this.POLLING_TIMEOUT_MS) {
      try {
        const statusResponse = await fetch(`${this.VEO_API_BASE_URL}/${operationName}`, {
          method: 'GET',
          // FIX: Use non-null assertion as GEMINI_API_KEY is checked above
          headers: { 'x-goog-api-key': this.GEMINI_API_KEY! },
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          this.logger.error(`Veo operation status error (${statusResponse.status}): ${JSON.stringify(errorData)}`);
          throw new InternalServerErrorException(`Veo operation status error: ${errorData.error?.message || 'Unknown API error'}`);
        }

        const statusResult = await statusResponse.json();
        this.logger.debug(`Polling operation ${operationName}: done=${statusResult.done}, progress=${JSON.stringify(statusResult.metadata)}`);

        if (statusResult.done === true) {
          if (statusResult.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
            return statusResult;
          } else if (statusResult.error) {
            this.logger.error(`Veo operation ${operationName} failed: ${JSON.stringify(statusResult.error)}`);
            throw new InternalServerErrorException(`Video generation operation failed: ${statusResult.error.message || 'Unknown error'}`);
          } else {
            this.logger.error(`Veo operation ${operationName} finished but video URI not found: ${JSON.stringify(statusResult)}`);
            throw new InternalServerErrorException('Video generation completed but failed to retrieve video URI.');
          }
        }
      } catch (error) {
        if (error instanceof InternalServerErrorException) {
          throw error;
        }
        this.logger.error(`Unexpected error polling Veo operation ${operationName}: ${error.message}`, error.stack);
        throw new InternalServerErrorException(`Unexpected error polling video operation: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, this.POLLING_INTERVAL_MS));
    }
    throw new InternalServerErrorException(`Video generation operation timed out after ${this.POLLING_TIMEOUT_MS / 1000} seconds.`);
  }

  async generateVideo(generateVideoDto: GenerateVideoDto): Promise<VideoGenerationResultDto> {
    if (!this.moduleControlService.isModuleEnabled('GoogleModule')) {
      this.logger.warn('Gemini API calls are disabled by ModuleControlService. Aborting API call.');
      throw new InternalServerErrorException('Gemini API functionality is currently disabled.');
    }
    if (!this.GEMINI_API_KEY) {
      throw new InternalServerErrorException('Gemini API key is not configured for video generation.');
    }

    const { prompt, conversationId } = generateVideoDto;
    const currentUserId = this.userId;
    const requestType = RequestType.VIDEO_GENERATION;
    let effectiveConversationId = conversationId || uuidv4();

    this.logger.log(`Initiating video generation for user ${currentUserId}, conversation ${effectiveConversationId} with prompt: "${prompt}"`);

    let operationName: string | undefined;
    let videoUri: string | null = null;

    try {
      const generateVideoPayload = {
        instances: [{ prompt: prompt }],
      };

      const initialResponse = await fetch(`${this.VEO_API_BASE_URL}/models/${this.VEO_MODEL_NAME}:predictLongRunning`, {
        method: 'POST',
        headers: {
          // FIX: Use non-null assertion as GEMINI_API_KEY is checked above
          'x-goog-api-key': this.GEMINI_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateVideoPayload),
      });

      if (!initialResponse.ok) {
        const errorData = await initialResponse.json();
        this.logger.error(`Failed to initiate Veo video generation (${initialResponse.status}): ${JSON.stringify(errorData)}`);
        throw new InternalServerErrorException(`Failed to initiate video generation: ${errorData.error?.message || 'Unknown API error'}`);
      }

      const initialResult: { name: string } = await initialResponse.json();
      operationName = initialResult.name;
      this.logger.debug(`Video generation operation started: ${operationName}`);

      const finalResult = await this._pollVideoOperation(operationName);
      videoUri = finalResult.response.generateVideoResponse.generatedSamples[0].video.uri;

      this.logger.log(`Video generation complete for operation ${operationName}. URI: ${videoUri}`);

      await this._saveVideoGenerationInteraction(
        currentUserId,
        prompt,
        this.VEO_MODEL_NAME,
        requestType,
        operationName,
        videoUri,
        effectiveConversationId
      );

      // FIX: Use non-null assertion for videoUri here
      return { videoUri: videoUri! };
    } catch (error) {
      this.logger.error(`Error in video generation process for prompt "${prompt}": ${error.message}`, error.stack);
      if (operationName) {
        this.logger.warn(`Operation ${operationName} failed to complete or retrieve URI.`);
        await this._saveVideoGenerationInteraction(
          currentUserId,
          prompt,
          this.VEO_MODEL_NAME,
          requestType,
          operationName,
          null,
          effectiveConversationId
        ).catch(saveError => this.logger.error(`Failed to save failed video generation interaction: ${saveError.message}`));
      }
      throw error;
    }
  }
}

