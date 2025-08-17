import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EslintService } from './eslint.service';
import { LintCodeDto } from './dto/lint-code.dto';
import { DiagnosticDto } from './dto/diagnostic.dto';
import { LintFilesDto } from './dto/lint-files.dto';
import { LintDirectoryDto } from './dto/lint-directory.dto';

@ApiTags('eslint')
@Controller('api/eslint')
export class EslintController {
  constructor(private readonly eslintService: EslintService) {}

  @Post('lint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lint a given code string using ESLint' })
  @ApiBody({
    type: LintCodeDto,
    description: 'Code content and optional file context for linting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns ESLint diagnostics (warnings/errors).',
    type: [DiagnosticDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'ESLint service error',
  })
  async lintCode(@Body() lintCodeDto: LintCodeDto): Promise<DiagnosticDto[]> {
    const { code, filePath, cwd } = lintCodeDto;
    return this.eslintService.lintCode(code, filePath, cwd);
  }

  @Post('lint-files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lint multiple given code strings (representing files) using ESLint',
  })
  @ApiBody({
    type: LintFilesDto,
    description:
      'An array of code contents with their virtual file paths for linting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns ESLint diagnostics grouped by file path.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/DiagnosticDto' },
      },
      example: { '/path/to/file1.ts': [], '/path/to/file2.ts': [] },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'ESLint service error',
  })
  async lintFiles(
    @Body() lintFilesDto: LintFilesDto,
  ): Promise<Record<string, DiagnosticDto[]>> {
    const { files, cwd } = lintFilesDto;
    return this.eslintService.lintFiles(files, cwd);
  }

  @Post('lint-directory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lint all files within a specified directory using ESLint',
  })
  @ApiBody({
    type: LintDirectoryDto,
    description: 'Path to the directory to lint and optional CWD.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns ESLint diagnostics grouped by file path.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/DiagnosticDto' },
      },
      example: { '/path/to/file1.ts': [], '/path/to/file2.ts': [] },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'ESLint service error',
  })
  async lintDirectory(
    @Body() lintDirectoryDto: LintDirectoryDto,
  ): Promise<Record<string, DiagnosticDto[]>> {
    const { directoryPath, cwd } = lintDirectoryDto;
    return this.eslintService.lintDirectory(directoryPath, cwd);
  }
}
