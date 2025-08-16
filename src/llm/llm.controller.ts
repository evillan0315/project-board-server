import {
  Controller,
  Post,
  Body,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth, // If you're using JWT
} from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { LlmInputDto, LlmOutputDto } from './dto';

// Assuming you have a JWT guard if authentication is used
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('LLM Operations')
@Controller('api/llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * Endpoint to generate code and file changes using the LLM.
   *
   * This operation takes a user prompt, project context, and a list of paths
   * to scan for relevant files. It returns proposed file changes, a summary,
   * and the LLM's thought process.
   *
   * @param llmInputDto The DTO containing the user prompt, project structure,
   *                      additional instructions, expected output format, and scan paths.
   * @param projectRoot The absolute path to the project root directory.
   * @returns An LlmOutputDto containing the proposed file changes, summary, and thought process.
   */
  @Post('generate-llm')
  // Uncomment the line below if you have JWT authentication and want to protect this endpoint
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth() // Show bearer token input in Swagger UI if using JWT
  @ApiOperation({ summary: 'Generate code and file changes using the LLM' })
  @ApiBody({
    type: LlmInputDto,
    description:
      'LLM input details including prompt, project context, and scan paths',
    examples: {
      aValidRequest: {
        summary: 'Example of a valid request to generate content',
        value: {
          userPrompt:
            'Generate a simple React component that displays "Hello World".',
          projectStructure:
            'This is a typical React project created with Vite.',
          scanPaths: ['src/App.tsx', 'public/index.html'],
          additionalInstructions:
            'Ensure the component is a functional component named HelloWorld.tsx.',
          expectedOutputFormat:
            '```json\n{"changes": [{"filePath": "...", "action": "add", "newContent": "..."}], "summary": "...", "thoughtProcess": "..."}\n```',
        },
      },
    },
  })
  @ApiQuery({
    name: 'projectRoot',
    description:
      'The absolute path to the project root directory. Files will be scanned and proposed changes will be relative to this root.',
    type: String,
    required: true,
    example: '/home/user/my-react-app',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Successfully generated LLM content and proposed file changes.',
    type: LlmOutputDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input provided (e.g., missing prompt, invalid file path format).',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'LLM module is disabled or user does not have permission.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'An unexpected error occurred during LLM processing or file scanning/parsing.',
  })
  async generateContent(
    @Body() llmInput: LlmInputDto,
    @Query('projectRoot') projectRoot: string,
  ): Promise<LlmOutputDto> {
    console.log(llmInput, 'llmInputDto');
    return this.llmService.generateContent(llmInput, projectRoot);
  }
}
