// src/eslint/eslint.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EslintService } from './eslint.service';
import { LintCodeDto } from './dto/lint-code.dto';
import { DiagnosticDto } from './dto/diagnostic.dto'; // Import DiagnosticDto for response type
// REMOVED: import { LintCodeResponseDto } from './dto/lint-code-response.dto';

@ApiTags('eslint')
@Controller('eslint')
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
    type: [DiagnosticDto], // REVERTED: Use array of DiagnosticDto for the response type
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'ESLint service error',
  })
  async lintCode(@Body() lintCodeDto: LintCodeDto): Promise<DiagnosticDto[]> {
    // REVERTED: Return type
    const { code, filePath, cwd } = lintCodeDto; // REMOVED: fullSwagger from destructuring
    return this.eslintService.lintCode(code, filePath, cwd);
  }
}
