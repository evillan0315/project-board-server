// src/google/google-gemini/google-gemini-file/google-gemini-file.controller.ts
import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { GoogleGeminiFileService } from './google-gemini-file.service';
import {
  GenerateTextDto,
  GenerateImageBase64Dto,
  GenerateFileDto,
} from './dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Gemini AI')
@Controller('api/gemini/file')
export class GoogleGeminiFileController {
  constructor(
    private readonly googleGeminiFileService: GoogleGeminiFileService,
  ) {}

  @Post('generate-text')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate text from a simple text prompt.' })
  @ApiResponse({
    status: 200,
    description: 'Generated text content.',
    type: String,
    example: 'Once upon a time...',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async generateText(
    @Body() generateTextDto: GenerateTextDto,
  ): Promise<string> {
    console.log(generateTextDto, 'generateTextDto');
    return this.googleGeminiFileService.generateText(generateTextDto);
  }

  @Post('generate-image-base64')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate text from a prompt with an embedded Base64 image.',
  })
  @ApiCreatedResponse({
    description: 'Generated text content based on the image and text prompt.',
    type: String,
    example:
      'The image shows a sunny landscape with green hills and a clear blue sky.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async generateTextWithBase64Image(
    @Body() generateImageBase64Dto: GenerateImageBase64Dto,
  ): Promise<string> {
    return this.googleGeminiFileService.generateTextWithBase64Image(
      generateImageBase64Dto,
    );
  }

  @Post('generate-file')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate text from a prompt with an uploaded file (e.g., .sql, .txt).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Prompt text and the file to be analyzed, with optional system instruction and conversation ID.',
    schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The text prompt for Gemini.',
          example: 'Analyze this SQL schema and suggest improvements.',
        },
        systemInstruction: {
          type: 'string',
          description: 'Optional system instruction for the model.',
          example: 'Act as a code reviewer.',
        }, // Removed required: false (it's implicit)
        conversationId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional ID of an ongoing conversation.',
          example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        }, // Removed required: false
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to attach (e.g., .sql, .txt, .csv).',
        },
      },
      // Explicitly list required fields at the schema level
      required: ['prompt', 'file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Generated text content based on the file and text prompt.',
    type: String,
    example:
      'The SQL schema defines tables for users, orders, and products. Consider adding indexes for faster lookups.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseInterceptors(FileInterceptor('file'))
  async generateTextWithFile(
    @UploadedFile() file: Express.Multer.File, // Move required parameter first
    @Body('prompt') prompt: string,
    @Body('systemInstruction') systemInstruction?: string,
    @Body('conversationId') conversationId?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided for analysis.');
    }
    if (!prompt) {
      throw new BadRequestException('Prompt is required.');
    }
    return this.googleGeminiFileService.generateTextWithFile(
      prompt,
      file,
      systemInstruction,
      conversationId,
    );
  }
}
