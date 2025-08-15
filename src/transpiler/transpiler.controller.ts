import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { TranspilerService } from './transpiler.service';
import { TranspilerRequestDto } from './dto/transpiler-request.dto';
import { TranspilerResponseDto } from './dto/transpiler-response.dto';

@ApiTags('Transpiler')
@Controller('api/transpile')
export class TranspilerController {
  constructor(private readonly transpilerService: TranspilerService) {}

  @Post()
  @ApiOperation({ summary: 'Transpile raw code string.' })
  @ApiBody({ type: TranspilerRequestDto })
  @ApiResponse({ status: 201, type: TranspilerResponseDto })
  async transpile(
    @Body() body: TranspilerRequestDto,
  ): Promise<TranspilerResponseDto> {
    const code = await this.transpilerService.transpile(body);
    return { code };
  }

  @Post('file')
  @ApiOperation({ summary: 'Transpile an uploaded file (React, SolidJS, TS).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        options: {
          type: 'object',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'Successfully transpiled uploaded file.',
    type: TranspilerResponseDto,
  })
  async transpileFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('options') options: any,
  ): Promise<TranspilerResponseDto> {
    const code = file.buffer.toString('utf8');
    const transpiled = await this.transpilerService.transpile({
      code,
      options,
    });
    return { code: transpiled };
  }

  @Post('files')
  @ApiOperation({ summary: 'Transpile multiple uploaded files.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        options: {
          type: 'object',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  @ApiResponse({
    status: 201,
    description: 'Successfully transpiled uploaded files.',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async transpileFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('options') options: any,
  ): Promise<{ results: { filename: string; code: string }[] }> {
    const results = await Promise.all(
      files.map(async (file) => {
        const code = file.buffer.toString('utf8');
        const transpiled = await this.transpilerService.transpile({
          code,
          options,
        });
        return { filename: file.originalname, code: transpiled };
      }),
    );
    return { results };
  }

  @Post('directory')
  @ApiOperation({
    summary: 'Transpile all valid files inside a ZIP archive (directory).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archive: { type: 'string', format: 'binary' },
        options: { type: 'object' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('archive'))
  @ApiResponse({
    status: 201,
    description: 'Successfully transpiled files from the directory archive.',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async transpileDirectory(
    @UploadedFile() archive: Express.Multer.File,
    @Body('options') options: any,
  ) {
    const results = await this.transpilerService.transpileDirectoryArchive(
      archive.buffer,
      options,
    );
    return { results };
  }
}
