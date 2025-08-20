// src/utils/utils.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Body,
  Res,
  Query,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import * as dotenv from 'dotenv'; // Keep if used for parsing env files
import * as fs from 'fs'; // For file system operations like unlinkSync
import * as path from 'path'; // For path manipulation
import { Root } from 'mdast'; // For Markdown AST
import { Response } from 'express'; // For @Res()
import { MarkdownDto } from './dto/markdown.dto';
import { UploadEnvDto } from './dto/upload-env.dto';
import { UploadJsonDto } from './dto/upload-json.dto'; // Consider if this is still needed, or use JsonBodyDto
import { JsonBodyDto } from './dto/json-body.dto';
import { diskStorage } from 'multer';
import { UtilsService } from './utils.service';
import { MarkdownUtilService } from './utils-markdown.service';
import { JsonFixService } from './json-fix.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { FormatCodeDto } from './dto/format-code.dto';
import { HtmlDto } from './dto/html.dto'; // <--- NEW: Import HtmlDto

class FixJsonDto {
  /** The raw JSON string that may be invalid or broken */
  jsonString: string;

  /** If false, disables Gemini fallback (default: true) */
  useGeminiFallback?: boolean = true;
}

@ApiTags('Utilities')
@Controller('api/utils')
export class UtilsController {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly jsonFixService: JsonFixService,
    private readonly markdownUtilService: MarkdownUtilService,
  ) {}

  @Post('json-fix')
  @ApiOperation({ summary: 'Fix malformed or invalid JSON' })
  @ApiBody({ type: FixJsonDto })
  @ApiResponse({ status: 200, description: 'Returns the repaired JSON object' })
  async fixJson(@Body() body: FixJsonDto) {
    if (!body.jsonString) {
      throw new BadRequestException('jsonString is required.');
    }

    const useGeminiFallback =
      body.useGeminiFallback !== undefined ? body.useGeminiFallback : true;

    const fixed = await this.jsonFixService.fixJson(
      body.jsonString,
      useGeminiFallback,
    );

    return { fixed };
  }
  @Get('get-directory')
  @ApiOperation({
    summary: 'Get directory from file path',
    description: 'Returns the directory part of the provided file path.',
  })
  @ApiQuery({
    name: 'filePath',
    type: String,
    description: 'Absolute or relative file path to extract the directory from',
    example: '/home/eddie/projects/app/src/index.ts',
  })
  @ApiResponse({
    status: 200,
    description: 'Directory extracted successfully.',
    schema: { example: '/home/eddie/projects/app/src' },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: filePath is missing or invalid.',
  })
  getDirectory(@Query('filePath') filePath: string): string {
    if (!filePath) {
      throw new Error('filePath query parameter is required');
    }
    return this.utilsService.getDirectory(filePath);
  }
  /**
   * Parses a semicolon-delimited key=value string from query param `mapString`
   * and returns a parsed object.
   *
   * Example:
   * GET /utils/parse-env-map?mapString=ts=typescript;js=javascript
   */
  @Get('parse-env-map')
  @ApiOperation({
    summary: 'Parse ENV-style map string',
    description:
      'Parses a semicolon-delimited key=value string into an object.',
  })
  @ApiQuery({
    name: 'mapString',
    required: false,
    type: String,
    example: 'ts=typescript;js=javascript',
    description: 'Semicolon-delimited key=value string to parse',
  })
  @ApiResponse({
    status: 200,
    description: 'Parsed key-value map',
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
      example: {
        ts: 'typescript',
        js: 'javascript',
      },
    },
  })
  parseEnvMap(@Query('mapString') mapString?: string): Record<string, string> {
    return this.utilsService.parseEnvMap(mapString);
  }
  @Post('format-code')
  @ApiOperation({ summary: 'Format source code using Prettier' })
  @ApiResponse({
    status: 200,
    description: 'Formatted code returned as string',
    schema: { type: 'string', example: 'function test() {\n  return 42;\n}' },
  })
  async formatCode(@Body() body: FormatCodeDto) {
    return this.utilsService.formatCode(body.code, body.language);
  }

  @Post('convert-to-svg')
  @ApiOperation({ summary: 'Convert an image to SVG' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        color: {
          type: 'string',
          example: '#000000',
          description: 'Fill color of the SVG output',
        },
        width: {
          type: 'number', // Changed to number for API spec clarity
          example: 512,
          description: 'Resize width (pixels)',
        },
        height: {
          type: 'number', // Changed to number for API spec clarity
          example: 512,
          description: 'Resize height (pixels)',
        },
      },
      required: ['file'], // Mark file as required
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Ensure this directory exists and is writable
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext);
          // Append timestamp to prevent filename collisions
          cb(null, `${name}-${Date.now()}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Image file is required for SVG conversion.',
      );
    }

    const tempPath = file.path; // Multer's diskStorage provides `file.path`

    const { color = '#000000' } = body;
    // Parse width and height to numbers, or use undefined if not provided/invalid
    const width = body.width ? parseInt(body.width.toString(), 10) : undefined;
    const height = body.height
      ? parseInt(body.height.toString(), 10)
      : undefined;

    // Check if parsing resulted in NaN (e.g., if input was "abc")
    if (width !== undefined && isNaN(width)) {
      throw new BadRequestException('Width must be a valid number.');
    }
    if (height !== undefined && isNaN(height)) {
      throw new BadRequestException('Height must be a valid number.');
    }

    let result;
    try {
      // Corrected method name: `convertToSvg` (assuming you've renamed it in UtilsService)
      // Pass numbers for width/height if your service expects them
      result = await this.utilsService.convertToSvg(
        tempPath,
        color,
        width,
        height,
      );
    } catch (error) {
      // More specific error handling for conversion
      throw new HttpException(
        `SVG conversion failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Ensure the temporary file is deleted even if conversion fails
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (unlinkError) {
          console.error(
            `Failed to delete temporary file ${tempPath}:`,
            unlinkError,
          );
          // Consider logging this or handling it gracefully without throwing to the client
        }
      }
    }

    return {
      message: 'SVG conversion successful',
      color,
      width,
      height,
      svg: result.svg,
      savedPath: result.filePath, // `filePath` is the path where the SVG was saved
    };
  }

  @Post('json-to-env')
  @ApiOperation({
    summary: 'Upload JSON file or provide JSON body to convert to .env',
    description:
      'Converts a JSON object (from file upload or request body) into a .env string. Optionally allows direct download of the .env file.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Optional: Upload a JSON file to convert.',
        },
        json: {
          type: 'object',
          additionalProperties: { type: 'string' },
          example: {
            DB_HOST: 'localhost',
            DB_USER: 'admin',
          },
          description:
            'Optional: Provide a JSON object directly in the request body.',
        },
        download: {
          type: 'boolean',
          example: true,
          default: false,
          description:
            'If true, the .env file will be downloaded; otherwise, the content is returned as plain text.',
        },
      },
      // At least one of file or json must be provided
      oneOf: [{ required: ['file'] }, { required: ['json'] }],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns .env as a file or raw string based on download option',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: 'DB_HOST=localhost\nDB_USER=admin',
        },
      },
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'The .env file content if download is true.',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async jsonToEnv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: JsonBodyDto, // Use JsonBodyDto for parsing JSON in body
    @Res() res: Response,
  ) {
    let json: Record<string, string>;

    if (file) {
      try {
        json = JSON.parse(file.buffer.toString('utf-8'));
      } catch (error) {
        throw new BadRequestException('Invalid JSON file format.');
      }
    } else if (body?.json) {
      json = body.json;
    } else {
      throw new BadRequestException(
        'Either a JSON file or a JSON body must be provided.',
      );
    }

    const envContent = Object.entries(json)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const shouldDownload = body.download ?? false;

    if (shouldDownload) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=".env"');
      res.send(envContent);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.send(envContent);
    }
  }

  @Post('env-to-json')
  @ApiOperation({
    summary: 'Convert uploaded .env file or a filepath to JSON',
    description:
      'Parses a .env file from an upload or filepath and returns its contents as a JSON object.',
  })
  @ApiBody({
    description: 'Upload a .env file or provide a filepath (only one)',
    type: UploadEnvDto, // This DTO should contain 'file' (for upload) and 'filepath' (for local path)
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Successfully parsed .env file.',
    schema: {
      type: 'object',
      properties: {
        filepath: { type: 'string', example: '.env.local' },
        data: {
          type: 'object',
          example: {
            DB_HOST: 'localhost',
            DB_USER: 'root',
          },
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) // FileInterceptor should process 'file' from multipart
  async envToJson(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadEnvDto,
  ) {
    // UtilsService.parseEnvFile should handle the logic of whether to use file.buffer or body.filepath
    return this.utilsService.parseEnvFile(file, body.filepath);
  }

  @Post('extract-title')
  @ApiOperation({
    summary: 'Extracts the first H1 or H2 title from Markdown content',
  })
  @ApiResponse({
    status: 200,
    description: 'Title successfully extracted',
    schema: {
      example: {
        title: 'Hello World',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  extractTitle(@Body() body: MarkdownDto) {
    // This logic can also be moved to UtilsService if you want to centralize Markdown utilities
    const match = body.content.match(/^#{1,2}\s+(.*)/m);
    const title = match ? match[1].trim() : null;
    return { title }; // Return as an object for consistent API response
  }

  // Utili for handling SQL
  @Post('parse-select')
  @ApiOperation({
    summary: 'Convert SELECT SQL to JSON',
    description:
      'Parses a simple SELECT SQL string into a structured JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: 'SELECT id, name FROM users WHERE active = 1',
        },
      },
    },
  })
  parseSelect(@Body('sql') sql: string) {
    try {
      return this.utilsService.parseSqlToJson(sql);
    } catch (e) {
      throw new BadRequestException(e.message); // Use BadRequestException for client errors
    }
  }

  @Post('parse-insert')
  @ApiOperation({
    summary: 'Convert INSERT SQL to JSON',
    description:
      'Parses a simple INSERT SQL string into a structured JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: "INSERT INTO users (id, name) VALUES (1, 'Alice')",
        },
      },
    },
  })
  parseInsert(@Body('sql') sql: string) {
    try {
      return this.utilsService.parseInsertSqlToJson(sql);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('json-to-insert')
  @ApiOperation({
    summary: 'Convert JSON to INSERT SQL',
    description: 'Generates a simple INSERT SQL string from a JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        table: { type: 'string', example: 'users' },
        data: {
          type: 'object',
          example: { id: 1, name: 'Alice' },
        },
      },
    },
  })
  jsonToSql(@Body() body: { table: string; data: Record<string, any> }) {
    try {
      return { sql: this.utilsService.jsonToInsertSql(body) };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('to-json')
  @ApiOperation({ summary: 'Convert Markdown to JSON AST' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        markdown: { type: 'string', example: '# Hello\n\nThis is **bold**.' },
      },
      required: ['markdown'],
    },
  })
  @ApiResponse({ status: 201, description: 'MDAST JSON returned.' })
  async convertToJson(@Body('markdown') markdown: string): Promise<Root> {
    return this.utilsService.markdownToJson(markdown);
  }

  @Post('to-markdown')
  @ApiOperation({ summary: 'Convert JSON AST to Markdown' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ast: {
          // Ensure `Root` type is correctly represented in Swagger if possible
          type: 'object',
          example: {
            type: 'root',
            children: [
              {
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Hello' }],
              },
            ],
          },
        },
      },
      required: ['ast'],
    },
  })
  @ApiResponse({ status: 201, description: 'Markdown string returned.' })
  async convertToMarkdown(@Body('ast') ast: Root): Promise<string> {
    return this.utilsService.jsonToMarkdown(ast);
  }

  @Post('to-html')
  @ApiOperation({ summary: 'Convert Markdown to HTML' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        markdown: { type: 'string', example: '# Hello\n\nParagraph here.' },
      },
      required: ['markdown'],
    },
  })
  @ApiResponse({ status: 201, description: 'HTML string returned.' })
  async convertToHtml(@Body('markdown') markdown: string): Promise<string> {
    return this.utilsService.markdownToHtml(markdown);
  }

  @Post('strip-code-block')
  @ApiOperation({ summary: 'Remove triple backticks from a code block' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: '```typescript\nconst x = 42;\n```',
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Code block without triple backticks returned.',
  })
  async stripCodeBlock(@Body('content') content: string): Promise<string> {
    return this.utilsService.stripTripleBackticks(content);
  }

  @Post('remove-code-comment')
  @ApiOperation({
    summary:
      'Remove code comments from a code block (single-line and multi-line)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: `
/**
 * Adds two numbers
 */
function add(a: number, b: number): number {
  // Add them
  return a + b;
}
        `.trim(),
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Code block with all comments removed is returned.',
  })
  async removeCodeComment(@Body('content') content: string): Promise<string> {
    return this.utilsService.removeComments(content);
  }

  @Post('markdown-to-plain-text')
  @ApiOperation({ summary: 'Convert Markdown to plain text' })
  @ApiBody({
    schema: { type: 'object', properties: { content: { type: 'string' } } },
  })
  async toPlainText(
    @Body('content') content: string,
  ): Promise<{ text: string }> {
    const text = await this.markdownUtilService.markdownToPlainText(content);
    return { text };
  }

  // --- NEW ENDPOINTS FOR DOCX CONVERSION ---

  @Post('markdown-to-docx')
  @ApiOperation({
    summary: 'Convert Markdown content to a DOCX document',
    description:
      'Converts the provided Markdown string into a Microsoft Word DOCX file. Requires Pandoc to be installed on the server.',
  })
  @ApiBody({ type: MarkdownDto }) // Reusing MarkdownDto for the content
  @ApiQuery({
    name: 'filename',
    required: false,
    type: String,
    description:
      'Optional: Desired filename for the downloaded DOCX file (e.g., "report"). Default is "document".',
    example: 'my_markdown_document',
  })
  @ApiResponse({
    status: 200,
    description: 'DOCX file generated successfully.',
    content: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid Markdown content or missing parameters.',
  })
  @ApiResponse({
    status: 412, // Precondition Failed: indicates Pandoc is not installed
    description:
      'Precondition Failed: Pandoc is not installed or not found in system PATH.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error: Failed to convert to DOCX.',
  })
  async markdownToDocx(
    @Body() body: MarkdownDto,
    @Res() res: Response,
    @Query('filename') filename?: string,
  ) {
    try {
      // The service handles its own temporary file naming
      const docxBuffer = await this.markdownUtilService.markdownToDocx(
        body.content,
      );
      const outputFilename = `${filename || 'document'}.docx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${outputFilename}"`,
      );
      res.send(docxBuffer);
    } catch (error) {
      // Check if it's the specific Pandoc not found error message
      if (
        error instanceof Error &&
        error.message.includes('Pandoc is not installed')
      ) {
        throw new HttpException(error.message, HttpStatus.PRECONDITION_FAILED); // 412 Precondition Failed
      }
      // Catch any other conversion errors
      throw new HttpException(
        `Failed to convert Markdown to DOCX: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('html-to-docx')
  @ApiOperation({
    summary: 'Convert HTML content to a DOCX document',
    description:
      'Converts the provided HTML string into a Microsoft Word DOCX file. Requires Pandoc to be installed on the server.',
  })
  @ApiBody({ type: HtmlDto }) // Using the new HtmlDto for the HTML content
  @ApiQuery({
    name: 'filename',
    required: false,
    type: String,
    description:
      'Optional: Desired filename for the downloaded DOCX file (e.g., "webpage"). Default is "document".',
    example: 'my_html_document',
  })
  @ApiResponse({
    status: 200,
    description: 'DOCX file generated successfully.',
    content: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid HTML content or missing parameters.',
  })
  @ApiResponse({
    status: 412, // Precondition Failed: indicates Pandoc is not installed
    description:
      'Precondition Failed: Pandoc is not installed or not found in system PATH.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error: Failed to convert to DOCX.',
  })
  async htmlToDocx(
    @Body() body: HtmlDto, // Use the new HtmlDto
    @Res() res: Response,
    @Query('filename') filename?: string,
  ) {
    try {
      // The service handles its own temporary file naming
      const docxBuffer = await this.markdownUtilService.htmlToDocx(body.html);
      const outputFilename = `${filename || 'document'}.docx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${outputFilename}"`,
      );
      res.send(docxBuffer);
    } catch (error) {
      // Check if it's the specific Pandoc not found error message
      if (
        error instanceof Error &&
        error.message.includes('Pandoc is not installed')
      ) {
        throw new HttpException(error.message, HttpStatus.PRECONDITION_FAILED); // 412 Precondition Failed
      }
      // Catch any other conversion errors
      throw new HttpException(
        `Failed to convert HTML to DOCX: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
