import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JsDocToMarkdownService } from './utils-jsdoc-to-markdown.service';

@ApiTags('JSDoc')
@Controller('api/docs')
export class JsDocToMarkdownController {
  constructor(private readonly jsdocService: JsDocToMarkdownService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate Markdown from JSDoc comments' })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: 'Path to the .ts or .tsx file',
  })
  @ApiResponse({
    status: 200,
    description: 'Markdown documentation content as string.',
  })
  async generateMarkdown(@Query('filePath') filePath: string): Promise<string> {
    if (!filePath) {
      throw new BadRequestException('filePath query parameter is required');
    }

    return this.jsdocService.generateMarkdownDoc(filePath);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export Markdown documentation to a file' })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: 'Path to the source .ts or .tsx file',
  })
  @ApiQuery({
    name: 'outputPath',
    required: true,
    description: 'Path where the Markdown file will be written',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully exported Markdown file',
  })
  async exportMarkdown(
    @Query('filePath') filePath: string,
    @Query('outputPath') outputPath: string,
  ): Promise<{ message: string }> {
    if (!filePath || !outputPath) {
      throw new BadRequestException(
        'Both filePath and outputPath are required',
      );
    }

    await this.jsdocService.exportMarkdownDoc(filePath, outputPath);
    return { message: 'Markdown documentation exported successfully.' };
  }
}
