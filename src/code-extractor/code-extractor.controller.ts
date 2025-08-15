// src/code-extractor/code-extractor.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CodeExtractorService } from './code-extractor.service';
import { ExtractCodeDto } from './dto/extract-code.dto';

@ApiTags('Code Extraction')
@Controller('api/code-extractor')
export class CodeExtractorController {
  constructor(private readonly codeExtractorService: CodeExtractorService) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract code blocks from markdown file' })
  @ApiResponse({
    status: 201,
    description: 'Code files extracted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input file path.' })
  async extract(@Body() dto: ExtractCodeDto) {
    try {
      return await this.codeExtractorService.extractAndSave(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
