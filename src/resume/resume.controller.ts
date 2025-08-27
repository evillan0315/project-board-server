// src/resume/resume.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  UnauthorizedException, // Ensure this is imported
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { User } from '@prisma/client'; // Assuming this User type is from Prisma
import { ResumeParserService } from './resume-parser.service';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import {
  OptimizeResumeDto,
  OptimizationResultDto,
  GenerateResumeDto,
  EnhanceResumeDto,
} from '../google/google-gemini/google-gemini-file/dto';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Express } from 'express';
import { CreateJwtUserDto } from '../auth/dto/auth.dto'; // The DTO for the user populated by JWT
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { UserService } from '../user/user.service'; // Assuming path to UserService

// No change to UploadResumeAndJobDescriptionDto as it's not directly used for the new logic

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Resume')
@Controller('api/resume')
export class ResumeController {
  constructor(
    private readonly resumeParserService: ResumeParserService,
    private readonly googleGeminiFileService: GoogleGeminiFileService,
    private readonly usersService: UserService,
  ) {}

  /**
   * Retrieves the application username and the access token for a specific linked provider.
   * This method ensures reusability for different social providers (e.g., 'github', 'google').
   *
   * @param req The Express Request object, expected to have 'user' populated by JwtAuthGuard.
   * @param providerName The name of the social provider (e.g., 'github', 'google').
   * @returns An object containing the application username and the provider's access token.
   * @throws UnauthorizedException if user info is missing, no accounts are linked,
   *         the specific provider account is not linked, or its access token is missing.
   */
  private async getProviderAccountData(
    req: Request,
    providerName: 'github' | 'google', // Explicitly type allowed provider names for safety
  ): Promise<{
    appUsername: string; // The username from our application's User model
    providerAccessToken: string; // The access token for the specified provider
  }> {
    const user = req['user'] as CreateJwtUserDto;
    if (!user?.email) {
      throw new UnauthorizedException('User information not found.');
    }

    // Fetch the full user data from the database, including linked accounts
    // Assumes UserService.findByEmail returns a User type that includes an 'Account' array
    const fullUser = await this.usersService.findByEmail(user.email);

    if (!fullUser || !fullUser.Account || fullUser.Account.length === 0) {
      throw new UnauthorizedException(
        'No social accounts linked to this user.',
      );
    }

    // Find the specific account for the requested provider
    const providerAccount = fullUser.Account.find(
      (account) => account.provider === providerName,
    );

    if (!providerAccount) {
      throw new UnauthorizedException(
        `${providerName} account not linked for this user.`,
      );
    }

    if (!providerAccount.access_token) {
      throw new UnauthorizedException(
        `${providerName} access token not found for this account.`,
      );
    }

    if (!fullUser.username) {
      // This refers to the 'username' property on your application's User model
      throw new UnauthorizedException(
        'Application username not found for the user.',
      );
    }

    return {
      appUsername: fullUser.username,
      providerAccessToken: providerAccount.access_token,
    };
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The resume file to parse (PDF or DOCX). Max 5MB.',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Extract plain text content from a PDF or DOCX resume file',
  })
  @ApiResponse({
    status: 200,
    description: 'Text successfully extracted from the file.',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description:
      'No file provided, unsupported file type, or file too large/corrupted.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during file parsing.',
  })
  async parseResumeFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<string> {
    return this.resumeParserService.extractTextFromFile(file);
  }

  @Post('optimize-from-file')
  @UseInterceptors(
    FileInterceptor('resumeFile', {
      storage: diskStorage({
        destination: (req: Request, file, cb) => {
          // req['user'] is populated by JwtAuthGuard
          const user = req['user'] as CreateJwtUserDto;
          if (!user?.id) {
            // This ensures a user ID is available for file storage path.
            return cb(
              new BadRequestException('User ID not available for file upload.'),
              '',
            );
          }
          const uploadPath = join(process.cwd(), 'resume', 'uploads', user.id);
          // Multer's diskStorage automatically creates the directory if it doesn't exist
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generate a unique filename using timestamp and a random number, preserving original extension
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resumeFile: {
          type: 'string',
          format: 'binary',
          description:
            'The resume file (PDF or DOCX). Max 5MB. Provide this OR resumeContent.',
          nullable: true,
        },
        resumeContent: {
          type: 'string',
          description:
            'The plain text content of the resume. Provide this OR resumeFile.',
          example: 'Experienced developer with 10 years experience...',
          nullable: true,
        },
        jobDescription: {
          type: 'string',
          description: 'The text content of the job description.',
          example:
            'Experienced Full Stack Developer skilled in React and Node.js...',
        },
        conversationId: {
          type: 'string',
          description:
            'Optional: An existing conversation ID for continued interaction with the AI model.',
          example: 'uuid-string-12345',
          nullable: true,
        },
      },
      required: ['jobDescription'],
    },
  })
  @ApiOperation({
    summary:
      'Parse a resume file/text and optimize it against a job description using Google Gemini',
  })
  @ApiResponse({
    status: 200,
    description: 'Resume optimization results returned successfully.',
    type: OptimizationResultDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input (missing file/text/job description, unsupported file type, parsing error).',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during processing or Gemini API call.',
  })
  async optimizeResumeFromFile(
    @Req() req: Request, // Moved to ensure required params are first
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
        fileIsRequired: false,
        exceptionFactory: (error) => new BadRequestException(error),
      }),
    )
    resumeFile: Express.Multer.File,
    @Body('resumeContent') resumeContent: string,
    @Body('jobDescription') jobDescription: string,
    @Body('conversationId') conversationId?: string,
  ): Promise<OptimizationResultDto> {
    const { appUsername, providerAccessToken } =
      await this.getProviderAccountData(req, 'google');

    if (!jobDescription || jobDescription.trim() === '') {
      throw new BadRequestException(
        'Job description is required for resume optimization.',
      );
    }

    let resumeData: string;
    if (resumeFile) {
      console.log(resumeFile, 'resumeFile');
      resumeData =
        await this.resumeParserService.extractTextFromFile(resumeFile);
    } else if (resumeContent && resumeContent.trim() !== '') {
      resumeData = resumeContent.trim();
    } else {
      throw new BadRequestException(
        'Either a resume file or plain text resume content is required for optimization.',
      );
    }

    const optimizeDto: OptimizeResumeDto = {
      resumeContent: resumeData,
      jobDescription: jobDescription,
      conversationId: conversationId,
    };

    const result =
      await this.googleGeminiFileService.optimizeResume(optimizeDto);

    return result;
  }

  // --- NEW ENDPOINTS ADDED BELOW ---

  @Post('generate-resume')
  @ApiOperation({
    summary:
      'Generate a new resume based on a detailed prompt using Google Gemini',
  })
  @ApiBody({ type: GenerateResumeDto })
  @ApiResponse({
    status: 200,
    description: 'Resume generated successfully.',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or missing prompt.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during Gemini API call.',
  })
  async generateResume(
    @Body() generateResumeDto: GenerateResumeDto,
  ): Promise<string> {
    if (!generateResumeDto.prompt || generateResumeDto.prompt.trim() === '') {
      throw new BadRequestException(
        'Prompt is required for resume generation.',
      );
    }
    return this.googleGeminiFileService.generateResume(generateResumeDto);
  }

  @Post('enhance-resume')
  @ApiOperation({
    summary:
      'Enhance an existing resume or a specific section using Google Gemini',
  })
  @ApiBody({ type: EnhanceResumeDto })
  @ApiResponse({
    status: 200,
    description: 'Resume enhanced successfully.',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing resume content.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during Gemini API call.',
  })
  async enhanceResume(
    @Body() enhanceResumeDto: EnhanceResumeDto,
  ): Promise<string> {
    if (
      !enhanceResumeDto.resumeContent ||
      enhanceResumeDto.resumeContent.trim() === ''
    ) {
      throw new BadRequestException(
        'Resume content is required for enhancement.',
      );
    }
    return this.googleGeminiFileService.enhanceResume(enhanceResumeDto);
  }
}
