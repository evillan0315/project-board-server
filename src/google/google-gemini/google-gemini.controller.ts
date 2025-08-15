import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoogleGeminiService } from './google-gemini.service';
import { GenerateDocDto } from './dto/generate-doc.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { OptimizeCodeDto } from './dto/optimize-code.dto';
import { AnalyzeCodeDto } from './dto/analyze-code.dto';
import { RepairCodeDto } from './dto/repair-code.dto';

@ApiTags('Google Gemini')
@Controller('api/google-gemini')
export class GoogleGeminiController {
  constructor(private readonly geminiService: GoogleGeminiService) {}
  @Post('optimize-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Optimize the given code for performance or readability',
  })
  @ApiResponse({
    status: 200,
    description: 'Optimized code returned successfully',
  })
  async optimizeCode(@Body() dto: OptimizeCodeDto): Promise<string> {
    return this.geminiService.optimizeCode(dto);
  }

  @Post('analyze-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze the given code for issues and improvements',
  })
  @ApiResponse({
    status: 200,
    description: 'Code analysis returned successfully',
  })
  async analyzeCode(@Body() dto: AnalyzeCodeDto): Promise<string> {
    return this.geminiService.analyzeCode(dto);
  }

  @Post('repair-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Repair syntax or logical errors in the given code',
  })
  @ApiResponse({
    status: 200,
    description: 'Repaired code returned successfully',
  })
  async repairCode(@Body() dto: RepairCodeDto): Promise<string> {
    return this.geminiService.repairCode(dto);
  }
  @Post('generate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate code using Google Gemini' })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated code',
    schema: {
      type: 'string',
      example: `### React UI Component\n\n\`\`\`tsx\nfunction UserProfileCard() { /* ... */ }\n\`\`\``,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 502,
    description: 'Google Gemini API request failed',
  })
  async generateCode(@Body() dto: GenerateCodeDto): Promise<string> {
    return this.geminiService.generateCode(dto);
  }

  @Post('generate-doc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate documentation from code snippet using Google Gemini',
    description:
      'Accepts a code snippet and optional parameters such as language, topic, isComment, and output format to generate documentation using Gemini.',
  })
  @ApiBody({
    type: GenerateDocDto,
    examples: {
      example1: {
        summary: 'JavaScript with inline comments',
        value: {
          codeSnippet: 'function add(a, b) {\n  return a + b;\n}',
          language: 'JavaScript',
          topic: 'Math utilities',
          isComment: true,
          output: 'markdown',
        },
      },
      example2: {
        summary: 'TypeScript without comments, JSON output',
        value: {
          codeSnippet:
            'export class AuthService {\n  login(user: any) {\n    return user;\n  }\n}',
          language: 'TypeScript',
          topic: 'Authentication Service',
          isComment: false,
          output: 'json',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Generated documentation based on the provided code snippet.',
    schema: {
      example: {
        markdown:
          '### Math utilities\n\n```js\n// Adds two numbers\nfunction add(a, b) {\n  return a + b;\n}\n```',
      },
    },
  })
  @ApiResponse({
    status: 502,
    description: 'Bad gateway - Gemini API failure or invalid response.',
  })
  async generateCodeDocumentation(
    @Body() body: GenerateDocDto,
  ): Promise<string> {
    return this.geminiService.generateCodeDocumentation(body);
  }
}
