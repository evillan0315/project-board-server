import {
  Controller,
  Post,
  Body,
  Query,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { LlmInputDto, LlmOutputDto } from './dto';

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
   */
  @Post('generate-llm')
  @ApiOperation({ summary: 'Generate code and file changes using the LLM' })
  @ApiBody({ type: LlmInputDto })
  @ApiQuery({
    name: 'projectRoot',
    description:
      'Absolute path to the project root directory. Files will be scanned and proposed changes will be relative to this root.',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LlmOutputDto,
  })
  async generateContent(
    @Body() llmInput: LlmInputDto,
    @Query('projectRoot') projectRoot: string,
  ): Promise<LlmOutputDto> {
    return this.llmService.generateContent(llmInput, projectRoot);
  }

  /**
   * Endpoint to generate the project structure in a tree format.
   */
  @Get('project-structure')
  @ApiOperation({
    summary: 'Generate the project structure (directory tree)',
  })
  @ApiQuery({
    name: 'projectRoot',
    description: 'Absolute path to the project root directory',
    type: String,
    required: true,
    example: '/home/user/my-react-app',
  })
  @ApiQuery({
    name: 'ignorePatterns',
    description:
      'Comma-separated list of directories/files to ignore (default: node_modules,.git,dist,build)',
    required: false,
    type: String,
    example: 'node_modules,.git,dist',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project structure successfully generated',
    schema: {
      type: 'string',
      example: `Project Structure (root: my-app)\n- src\n  - main.ts\n  - app.module.ts\n- package.json\n- tsconfig.json`,
    },
  })
  async getProjectStructure(
    @Query('projectRoot') projectRoot: string,
    @Query('ignorePatterns') ignorePatterns?: string,
  ): Promise<string> {
    const ignoreList = ignorePatterns
      ? ignorePatterns.split(',').map((s) => s.trim())
      : undefined;

    return this.llmService.generateProjectStructure(projectRoot, ignoreList);
  }
}

