import {
  Controller,
  Get,
  Post,
  Res,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  StreamableFile,
  Logger,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { cwd } from 'process';
import { Response } from 'express';

import { lookup as mimeLookup } from 'mime-types';
import { ReadFileDto } from './dto/read-file.dto';
import { ReadFileResponseDto } from './dto/read-file-response.dto';
import { ReadMultipleFilesDto } from './dto/read-multiple-files.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { RenameFileDto, RenameFileResponseDto } from './dto/rename-file.dto';
import { CopyFileDto, CopyFileResponseDto } from './dto/copy-file.dto';
import { MoveFileDto, MoveFileResponseDto } from './dto/move-file.dto';
import { SearchFileDto } from './dto/search-file.dto';
import { SearchFileResponseDto } from './dto/search-file-response.dto';
import { ScanFileDto, ScannedFileDto } from './dto/scan-file.dto';

import { FileService } from './file.service';
import { FileGateway } from './file.gateway';

import { FileValidationService } from '../common/services/file-validation.service';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('File & Folder')
@Controller('api/file')
export class FileController {
  private readonly logger = new Logger(FileController.name);
  constructor(
    private readonly fileValidator: FileValidationService,
    private readonly fileService: FileService,
  ) {}

  @Post('open')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Open a file and return its content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute or relative file path',
          example: '/path/to/file.txt',
        },
      },
      required: ['filePath'],
    },
  })
  @ApiOkResponse({
    description: 'File opened successfully and content returned.',
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'filePath is required.' })
  @ApiNotFoundResponse({ description: 'File not found.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to open file.' })
  async openFile(
    @Body('filePath') filePath: string,
  ): Promise<{ filePath: string; content: string }> {
    if (!filePath) {
      throw new BadRequestException('filePath is required.');
    }

    const absolutePath = path.resolve(cwd(), filePath);
    try {
      const stats = await fs.promises.stat(absolutePath);
      if (!stats.isFile()) {
        throw new NotFoundException(`Path '${filePath}' is not a file.`);
      }

      const content = await fs.promises.readFile(absolutePath, 'utf-8');
      return { filePath, content };
    } catch (err: any) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(`File not found: ${filePath}`);
      }
      this.logger.error(`Failed to open file: ${err.message}`);
      throw new InternalServerErrorException(`Failed to open file: ${err.message}`);
    }
  }

  @Post('close')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Acknowledge file close request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path of the file to close',
          example: '/path/to/file.txt',
        },
      },
      required: ['filePath'],
    },
  })
  @ApiOkResponse({
    description: 'File close acknowledged.',
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'filePath is required.' })
  async closeFile(
    @Body('filePath') filePath: string,
  ): Promise<{ filePath: string; message: string }> {
    if (!filePath) {
      throw new BadRequestException('filePath is required.');
    }

    return { filePath, message: `File ${filePath} closed successfully.` };
  }

  @Get('list')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List files and folders in a directory' })
  @ApiQuery({
    name: 'directory',
    required: false,
    description: 'Path to the directory (defaults to current working directory)',
  })
  @ApiQuery({
    name: 'recursive',
    required: false,
    type: Boolean,
    description: 'List files recursively (defaults to false)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of files and directories returned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid directory path' })
  @ApiResponse({
    status: 500,
    description: 'Failed to list directory contents',
  })
  async getFiles(
    @Query('directory') directory?: string,
    @Query('recursive') recursive: boolean = false,
  ) {
    return this.fileService.getFilesByDirectory(directory, recursive);
  }

  @Get('stream')
  @ApiOperation({
    summary: 'Stream media file with HTTP range support',
  })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: 'The absolute or relative file path to stream',
    example: '/path/to/file.mp3',
  })
  @ApiOkResponse({
    description: 'Streams the media file',
    content: {
      'video/mp4': { schema: { type: 'string', format: 'binary' } },
      'audio/mpeg': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'The filePath query parameter was missing or invalid',
  })
  @ApiNotFoundResponse({
    description: 'The specified file does not exist or is not a file',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to stream file due to a server error',
  })
  async streamFile(@Query('filePath') filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new BadRequestException('Query parameter "filePath" is required');
    }

    try {
      const absolutePath = path.resolve(filePath);
      const stats = await fs.promises.stat(absolutePath);
      if (!stats.isFile()) {
        throw new NotFoundException(`Path is not a file: ${filePath}`);
      }

      const fileSize = stats.size;
      const fileName = path.basename(absolutePath);
      const mimeType = mimeLookup(fileName) || 'application/octet-stream';

      const range = res.req.headers.range;
      if (!range) {
        res.set({
          'Content-Type': mimeType,
          'Content-Length': fileSize,
        });
        fs.createReadStream(absolutePath).pipe(res);
      } else {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
        });

        fs.createReadStream(absolutePath, { start, end }).pipe(res);
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to stream file: ${(error as Error).message}`);
    }
  }

  @Get('download')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Stream a file directly to the client',
  })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: 'The absolute or relative file path to stream',
    example: '/path/to/your/file.mp3',
  })
  @ApiOkResponse({
    description: 'The file was successfully streamed to the client',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The filePath query parameter was missing or invalid',
  })
  @ApiNotFoundResponse({
    description: 'The specified file does not exist or is not a file',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to stream file due to a server error',
  })
  async downloadFile(
    @Query('filePath') filePath: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!filePath) {
      throw new BadRequestException('Query parameter "filePath" is required');
    }

    try {
      const absolutePath = path.resolve(filePath);
      const stats = await fs.promises.stat(absolutePath);

      if (!stats.isFile()) {
        throw new NotFoundException(`Path is not a file: ${filePath}`);
      }

      const fileName = this.extractFileName(filePath);
      const mimeType = mimeLookup(fileName) || 'application/octet-stream';

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': stats.size.toString(),
      });

      const readStream = fs.createReadStream(absolutePath);

      readStream.on('error', (err) => {
        this.logger.error(`File stream error: ${err.message}`);
        res.end();
      });

      return new StreamableFile(readStream);
    } catch (error) {
      this.logger.error(`Failed to stream file: ${(error as Error).message}`);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to stream file: ${(error as Error).message}`);
    }
  }

  private extractFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || 'file';
  }

  @Post('read')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Read file content from an uploaded file, local path, or URL',
    description:
      'Provides file content based on the input source. You can upload a file, specify a local file path, or provide a URL to a remote file.',
  })
  @ApiResponse({ status: 200, type: ReadFileResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Upload a file (optional if filePath or url is provided)',
        },
        filePath: {
          type: 'string',
          description: 'Absolute or relative path to a file on the local file system',
        },
        url: {
          type: 'string',
          description: 'URL of a remote file to fetch content from',
        },
        generateBlobUrl: {
          type: 'boolean',
          description: 'If true, returns content as a base64 blob-style data URL.',
        },
      },
      required: [],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async readFileContent(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ReadFileDto,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename, filePath } = await this.fileService.resolveFile(file, body);

    const fileData = await this.fileService.readFile(
      buffer,
      filename,
      body.generateBlobUrl,
      filePath,
    );

    if (body.generateBlobUrl && filePath) {
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Requested file not found for streaming.');
      }
      res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    res.json(fileData);
  }

  @Post('read-many')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload and read content from multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Multiple files to upload and read',
        },
        generateBlobUrl: {
          type: 'boolean',
          description: 'If true, returns content as base64 blob-style data URLs.',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contents of multiple files returned successfully.',
    type: [ReadFileResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'No files uploaded or validation failed.',
  })
  @UseInterceptors(FilesInterceptor('files'))
  async readMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: ReadMultipleFilesDto,
  ): Promise<ReadFileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }
    this.fileValidator.validateMultipleFiles(files);

    return await this.fileService.readMultipleFiles(
      files.map((file) => ({
        buffer: file.buffer,
        filename: file.originalname,
      })),
      body.generateBlobUrl,
    );
  }

  @Get('proxy')
  @ApiOperation({
    summary: 'Proxies an image URL and streams the image content',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'The URL of the image to proxy',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Image successfully proxied' })
  @ApiResponse({ status: 400, description: 'Missing or invalid image URL' })
  @ApiResponse({
    status: 500,
    description: 'Error fetching or streaming image',
  })
  async proxy(@Query('url') url: string, @Res() res: Response): Promise<void> {
    await this.fileService.proxyImage(url, res);
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new file or folder' })
  @ApiBody({ type: CreateFileDto })
  @ApiResponse({
    status: 201,
    description: 'File or folder successfully created.',

    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        filePath: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or path.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() dto: CreateFileDto): Promise<{ success: boolean; filePath: string }> {
    return this.fileService.createLocalFileOrFolder(dto);
  }

  @Post('create-folder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBody({ type: CreateFileDto })
  @ApiResponse({
    status: 201,
    description: 'Folder successfully created.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        filePath: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or path.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createFolder(@Body() dto: CreateFileDto): Promise<{ success: boolean; filePath: string }> {
    if (!dto.isDirectory) {
      throw new BadRequestException('For create-folder, isDirectory must be true.');
    }
    return this.fileService.createLocalFileOrFolder(dto);
  }

  @Post('write')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Write content to a file at a specified path',
    description:
      'Creates a new file or overwrites an existing one with the provided content. Parent directories will be created if they do not exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'File written successfully.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute or relative file path',
          example: '/path/to/your/file.txt',
        },
        content: {
          type: 'string',
          description: 'Text content to write into the file',
          example: 'This is the content of the file.',
        },
      },
      required: ['filePath', 'content'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Both filePath and content are required.',
  })
  @ApiResponse({ status: 500, description: 'Failed to write file.' })
  async writeFileContent(
    @Body() body: UpdateFileDto,
  ): Promise<{ success: boolean; message: string }> {
    const { filePath, content } = body;
    if (!filePath || typeof content !== 'string') {
      throw new BadRequestException('Both filePath and content must be provided.');
    }
    return this.fileService.writeLocalFileContent(filePath, content);
  }

  @Post('delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a file or folder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'The path to the file or folder to delete.',
          example: '/path/to/file_or_folder.txt',
        },
      },
      required: ['filePath'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted the file or folder.',
  })
  @ApiResponse({ status: 400, description: 'Path not found or invalid.' })
  @ApiResponse({
    status: 500,
    description: 'Failed to delete the file or folder.',
  })
  async deleteFile(
    @Body('filePath') filePath: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!filePath) {
      throw new BadRequestException('File path is required for deletion.');
    }
    return this.fileService.deleteLocalFile(filePath);
  }

  @Post('rename')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rename a file or folder' })
  @ApiResponse({
    status: 200,
    description: 'File or folder renamed successfully.',
    type: RenameFileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or target already exists.',
  })
  @ApiResponse({
    status: 404,
    description: 'Source path does not exist.',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to rename file or folder.',
  })
  async renameFileOrFolder(@Body() body: RenameFileDto): Promise<RenameFileResponseDto> {
    return this.fileService.renameLocalFileOrFolder(body.oldPath, body.newPath);
  }

  @Post('copy')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Copy a file or folder' })
  @ApiBody({ type: CopyFileDto })
  @ApiResponse({
    status: 200,
    description: 'File or folder copied successfully.',
    type: CopyFileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or destination already exists.',
  })
  @ApiResponse({
    status: 404,
    description: 'Source path does not exist.',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to copy file or folder.',
  })
  async copyFileOrFolder(@Body() body: CopyFileDto): Promise<CopyFileResponseDto> {
    return this.fileService.copyLocalFileOrFolder(body.sourcePath, body.destinationPath);
  }

  @Post('move')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Move a file or folder' })
  @ApiBody({ type: MoveFileDto })
  @ApiResponse({
    status: 200,
    description: 'File or folder moved successfully.',
    type: MoveFileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or destination already exists.',
  })
  @ApiResponse({
    status: 404,
    description: 'Source path does not exist.',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to move file or folder.',
  })
  async moveFileOrFolder(@Body() body: MoveFileDto): Promise<MoveFileResponseDto> {
    return this.fileService.moveLocalFileOrFolder(body.sourcePath, body.destinationPath);
  }

  @Post('search')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Search files and folders by name recursively' })
  @ApiResponse({
    status: 200,
    description: 'Matching files and folders returned successfully.',
    type: [SearchFileResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or directory not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to complete search operation.',
  })
  async searchFiles(@Body() body: SearchFileDto): Promise<SearchFileResponseDto[]> {
    const directory = body.directory ?? '.';
    return this.fileService.searchFilesByName(directory, body.searchTerm);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<ReadFileResponseDto> {
    const resolved = await this.fileService.resolveFile(file);
    return this.fileService.readFile(resolved.buffer, resolved.filename);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
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
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully.' })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ReadFileResponseDto[]> {
    const fileDataPromises = files.map((file) => this.fileService.resolveFile(file));
    const resolvedFiles = await Promise.all(fileDataPromises);
    return this.fileService.readMultipleFiles(resolvedFiles);
  }

  @Post('scan')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Scans specified directories and files for relevant code files',
    description:
      'Recursively scans paths, reads content of relevant files, and returns their absolute path, relative path, and content. Uses internal exclusion lists for common development artifacts like node_modules.',
  })
  @ApiBody({ type: ScanFileDto })
  @ApiOkResponse({
    description: 'List of scanned files returned successfully.',
    type: [ScannedFileDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to perform project scan.',
  })
  async scanFile(@Body() dto: ScanFileDto): Promise<ScannedFileDto[]> {
    // Determine the paths to be passed to the fileService.scan method.
    // If dto.scanPaths is provided and is an array, use it.
    // Otherwise, pass an empty array, letting FileService.scan default to projectRoot.
    const scanPathsToUse = Array.isArray(dto.scanPaths) ? dto.scanPaths : [];
    const projectRoot = dto.projectRoot || process.cwd();
    const verbose = dto.verbose ?? false;

    // Log the effective scan paths for clarity
    if (verbose) {
      if (scanPathsToUse.length === 0) {
        this.logger.debug(
          `Scan request received with no specific paths. FileService will default to scanning project root: ${projectRoot}`,
        );
      } else {
        this.logger.debug(
          `Scan request received with specific paths: ${scanPathsToUse.join(', ')}`,
        );
      }
    }

    try {
      return await this.fileService.scan(scanPathsToUse, projectRoot, verbose);
    } catch (error) {
      this.logger.error(
        `Failed to scan project: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(`Failed to scan project: ${(error as Error).message}`);
    }
  }
}
