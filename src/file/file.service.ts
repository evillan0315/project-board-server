import {
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventEmitter } from 'events'; // Standard Node.js EventEmitter
import axios from 'axios';
import { promises as fs, Dirent } from 'fs';
//import * as fs from 'fs/promises';
import * as fsExtra from 'fs-extra'; // Provides pathExists, remove, move, createReadStream
import * as path from 'path';
import { Readable } from 'stream';
import { lookup as mimeLookup } from 'mime-types';
import { get as httpGet } from 'http';
import { get as httpsGet } from 'https';
import { URL } from 'url';
import { ModuleControlService } from '../module-control/module-control.service';
import { CreateFileDto } from './dto/create-file.dto';
import { ReadFileResponseDto } from './dto/read-file-response.dto';
import { ReadFileDto } from './dto/read-file.dto';
import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { ScannedFileDto } from './dto/scan-file.dto';
import { FileTreeNode } from './file.interface';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

import { UtilsService } from '../utils/utils.service';

@Injectable()
export class FileService implements OnModuleInit {
  private readonly BASE_DIR = `${process.env.BASE_DIR}`;
  private readonly logger = new Logger(FileService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly allowedExtensions: string[];

  // --- START: New properties for the `scan` method's file/dir filtering ---
  private static readonly RELEVANT_FILE_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.yml',
    '.html',
    '.css',
    '.scss',
    '.less',
    '.cjs',
    '.mjs',
    '.toml',
    '.xml', // config and module types
    '.jsonc', // JSON with comments
    '.vue',
    '.svelte', // Frontend frameworks
    '.graphql',
    '.gql', // GraphQL schema/queries
    '.sql', // Database schemas
    '.py',
    '.rb',
    '.go',
    '.java',
    '.c',
    '.cpp',
    '.cs',
    '.php', // Backend/other languages
    '.sh',
    '.bash',
    '.zsh', // Shell scripts
    '.env', // Environment files
    '.txt', // Plain text
  ]);

  private static readonly EXCLUDE_DIR_NAMES_FOR_SCAN = new Set([
    'node_modules',
    '.git',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'out',
    'coverage',
    '__pycache__',
    'venv',
    'target',
    'vendor',
    '.ai-editor-logs',
  ]);

  private static readonly EXCLUDE_FILE_NAMES_FOR_SCAN = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
  ]);

  private static readonly RELEVANT_CONFIG_FILENAMES_FOR_SCAN = new Set([
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'webpack.config.js',
    'rollup.config.js',
    'tailwind.config.ts',
    '.gitignore',
    '.eslintrc.js',
    '.prettierrc.js',
    'Dockerfile',
    'Makefile',
    'LICENSE',
    'README.md',
    'README.txt',
    'biome.json',
    'jest.config.ts',
    '.env.local',
    '.env.development',
    '.env.production',
  ]);
  // --- END: New properties for the `scan` method's file/dir filtering ---

  constructor(
    private readonly moduleControlService: ModuleControlService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    @Inject('EXCLUDED_FOLDERS') private readonly EXCLUDED_FOLDERS: string[], // This is used by getFilesByDirectory
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.maxFileSize =
      this.configService.get<number>('file.maxSize') ?? 5 * 1024 * 1024;
    this.allowedMimeTypes =
      this.configService.get<string[]>('file.allowedMimeTypes') ?? [];
    this.allowedExtensions =
      this.configService.get<string[]>('file.allowedExtensions') ?? [];

    this.ensureConfigurationIsValid();
  }

  onModuleInit() {
    if (!this.moduleControlService.isModuleEnabled('FileModule')) {
      this.logger.warn(
        'FileModule is currently disabled via ModuleControlService. File operations will be restricted.',
      );
    }
  }

  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('FileModule')) {
      throw new ForbiddenException(
        'File module is currently disabled. Cannot perform file operations.',
      );
    }
  }

  private ensureConfigurationIsValid(): void {
    if (typeof this.maxFileSize !== 'number' || this.maxFileSize <= 0) {
      this.logger.error(
        'File validation configuration error: file.maxSize must be a positive number.',
      );
      throw new InternalServerErrorException(
        'File validation configuration error: file.maxSize must be a positive number.',
      );
    }
    if (
      !Array.isArray(this.allowedMimeTypes) ||
      this.allowedMimeTypes.some((type) => typeof type !== 'string')
    ) {
      this.logger.error(
        'File validation configuration error: file.allowedMimeTypes must be an array of strings.',
      );
      throw new InternalServerErrorException(
        'File validation configuration error: file.allowedMimeTypes must be an array of strings.',
      );
    }
    if (
      !Array.isArray(this.allowedExtensions) ||
      this.allowedExtensions.some(
        (ext) => typeof ext !== 'string' || !ext.startsWith('.'),
      )
    ) {
      this.logger.error(
        'File validation configuration error: file.allowedExtensions must be an array of strings starting with a dot.',
      );
      throw new InternalServerErrorException(
        'File validation configuration error: file.allowedExtensions must be an array of strings starting with a dot.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.sub;
  }

  private validateUploadedFile(file: Express.Multer.File): void {
    this.ensureFileModuleEnabled();

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Uploaded file "${file.originalname}" exceeds size limit (${this.formatBytes(this.maxFileSize)}).`,
      );
    }
    const normalizedMimeType = file.mimetype.split(';')[0].toLowerCase();
    if (!this.allowedMimeTypes.includes(normalizedMimeType)) {
      throw new BadRequestException(
        `Unsupported file type: "${file.mimetype}". Allowed types are: ${this.allowedMimeTypes.join(', ')}.`,
      );
    }
  }

  private validateFileExtension(filePath: string): void {
    this.ensureFileModuleEnabled();

    const ext = path.extname(filePath).toLowerCase();
    if (ext && !this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file extension: "${ext}". Allowed extensions are: ${this.allowedExtensions.join(', ')}.`,
      );
    }
  }

  private extractFilename(pathOrUrl: string): string {
    return path.basename(pathOrUrl) || 'file';
  }

  private async resolveFromLocalPath(
    filePath: string,
  ): Promise<{ buffer: Buffer; filename: string; filePath: string }> {
    this.ensureFileModuleEnabled();

    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, filename: this.extractFilename(filePath), filePath };
    } catch (error) {
      this.logger.error(
        `Failed to read file from path: ${filePath}. Error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new BadRequestException(
        `Unable to read file from path: ${filePath}. Error: ${(error as Error).message}`,
      );
    }
  }

  private async resolveFromUrl(
    url: string,
  ): Promise<{ buffer: Buffer; filename: string; filePath: string }> {
    this.ensureFileModuleEnabled();

    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = res.headers['content-type'];

      const normalizedContentType = contentType?.split(';')[0].toLowerCase();

      if (
        normalizedContentType &&
        !this.allowedMimeTypes.includes(normalizedContentType)
      ) {
        throw new BadRequestException(
          `Unsupported remote file type: "${contentType}". Allowed types are: ${this.allowedMimeTypes.join(', ')}.`,
        );
      }

      return {
        buffer: Buffer.from(res.data),
        filename: this.extractFilename(new URL(url).pathname),
        filePath: url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch file from URL: ${url}. Error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new BadRequestException(
        `Unable to fetch file from URL: ${url}. Error: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Resolves file content from an uploaded file, local path, or URL.
   * Performs validation based on configured limits and allowed types.
   */
  async resolveFile(
    file?: Express.Multer.File,
    body?: ReadFileDto,
  ): Promise<{ buffer: Buffer; filename: string; filePath: string }> {
    this.ensureFileModuleEnabled();

    if (file?.buffer) {
      this.validateUploadedFile(file);
      return {
        buffer: file.buffer,
        filename: file.originalname || 'file',
        filePath: '', // No explicit filePath for uploaded file
      };
    }

    if (body?.filePath) {
      this.validateFileExtension(body.filePath);
      return this.resolveFromLocalPath(body.filePath);
    }

    if (body?.url) {
      const urlFilename = this.extractFilename(new URL(body.url).pathname);
      this.validateFileExtension(urlFilename);
      return this.resolveFromUrl(body.url);
    }

    throw new BadRequestException('Please provide a file, filePath, or url.');
  }

  async getFileContent(filePath: string): Promise<string> {
    this.ensureFileModuleEnabled();

    const absolutePath = path.resolve(filePath);

    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        throw new BadRequestException(`Path '${filePath}' is not a file.`);
      }

      const content = await fs.readFile(absolutePath, { encoding: 'utf8' });
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(`File not found at path: ${filePath}`);
      }
      throw new InternalServerErrorException(
        `Error reading file content for '${filePath}': ${(error as Error).message}`,
      );
    }
  }

  /**
   * Returns a readable stream for the specified file path.
   * Throws an error if the path does not exist or is not a file.
   */
  async getFileReadStream(filePath: string): Promise<Readable> {
    this.ensureFileModuleEnabled();

    const absolutePath = path.resolve(filePath);

    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        throw new BadRequestException(
          `Path '${filePath}' is not a file or does not exist.`,
        );
      }

      return fsExtra.createReadStream(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(`File not found at path: ${filePath}`);
      }
      throw new InternalServerErrorException(
        `Error preparing file for download '${filePath}': ${(error as Error).message}`,
      );
    }
  }

  async getFileReadStreamWithProgress(
    filePath: string,
    clientId: string,
    emitter: EventEmitter,
  ): Promise<Readable> {
    this.ensureFileModuleEnabled();

    const absolutePath = path.resolve(filePath);

    try {
      const stats = await fsExtra.stat(absolutePath);
      if (!stats.isFile()) {
        throw new BadRequestException(`Path '${filePath}' is not a file.`);
      }

      const fileSize = stats.size;
      let bytesRead = 0;

      const stream = fsExtra.createReadStream(absolutePath);

      stream.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        const progress = ((bytesRead / fileSize) * 100).toFixed(2);
        emitter.emit('fileProgress', { clientId, progress: Number(progress) });
      });

      stream.on('end', () => {
        emitter.emit('fileComplete', { clientId });
      });

      stream.on('error', (err) => {
        this.logger.error(
          `File stream error for ${filePath}: ${err.message}`,
          err.stack,
        );
        emitter.emit('fileError', { clientId, error: err.message });
      });

      return stream;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(`File not found at path: ${filePath}`);
      }
      throw new InternalServerErrorException(
        `Error preparing file for download '${filePath}': ${(error as Error).message}`,
      );
    }
  }

  /**
   * Lists files and folders in a specified directory, optionally recursively.
   * This method uses the injected EXCLUDED_FOLDERS and specific blockedPaths.
   */
  async getFilesByDirectory(
    directory = '',
    recursive = false,
  ): Promise<FileTreeNode[]> {
    this.ensureFileModuleEnabled(); // Ensure module is enabled for this operation

    const dir = path.resolve(this.BASE_DIR || process.cwd(), directory);
    const blockedPaths = ['/proc', '/sys', '/dev', '/run', '/lost+found']; // System paths
    const userDefinedExcludedFolders = this.EXCLUDED_FOLDERS; // Injected folders

    // Check for explicit blocked system paths (absolute path check)
    if (blockedPaths.some((blocked) => dir.startsWith(blocked))) {
      this.logger.warn(`Skipped restricted system directory: ${dir}`);
      return [];
    }

    const results: FileTreeNode[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true }); // Get Dirent objects directly

      for (const entry of entries) {
        // Exclude user-defined folders by name (basename check)
        if (userDefinedExcludedFolders.includes(entry.name)) {
          this.logger.debug(`Skipping user-excluded folder: ${entry.name}`);
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        try {
          // No need for fs.lstat here as entry is already Dirent
          const stat = entry; // Dirent has isDirectory, isFile, etc.

          const isDir = stat.isDirectory();

          // Detect language and MIME type
          const mimeType = isDir
            ? undefined
            : mimeLookup(entry.name) || 'application/octet-stream';
          let lang = isDir
            ? undefined
            : this.utilsService.detectLanguage(entry.name, mimeType);

          if (mimeType?.startsWith('image/')) {
            lang = 'image';
          }

          const fileItem: FileTreeNode = {
            name: entry.name,
            path: fullPath,
            isDirectory: isDir,
            type: isDir ? 'folder' : 'file',
            lang,
            mimeType,
            // Stat properties might need actual fs.stat for size/time
            size: undefined, // Will be filled if it's a file
            createdAt: undefined, // Will be filled if it's a file
            updatedAt: undefined, // Will be filled if it's a file
            children: [],
          };

          if (!isDir) {
            // If it's a file, get full stats
            const fullStat = await fs.stat(fullPath);
            fileItem.size = fullStat.size;
            fileItem.createdAt = fullStat.birthtime;
            fileItem.updatedAt = fullStat.mtime;
          }

          if (isDir && recursive) {
            fileItem.children = await this.getFilesByDirectory(fullPath, true);
          }

          results.push(fileItem);
        } catch (entryErr: any) {
          this.logger.warn(
            `Skipped "${fullPath}" due to error: ${entryErr.code || entryErr.message}`,
          );
          continue;
        }
      }

      return results;
    } catch (err: any) {
      this.logger.error(
        `Failed to list directory contents for "${dir}": ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        `Failed to list directory contents: ${err.message}`,
      );
    }
  }

  // --- START: New helper methods for the `scan` function's specific filtering ---

  private isExcludedDirForScan(dirName: string): boolean {
    return FileService.EXCLUDE_DIR_NAMES_FOR_SCAN.has(dirName);
  }

  private isExcludedFileForScan(fileName: string): boolean {
    return FileService.EXCLUDE_FILE_NAMES_FOR_SCAN.has(fileName);
  }

  private isRelevantFileForScan(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return (
      FileService.RELEVANT_FILE_EXTENSIONS.has(ext) ||
      FileService.RELEVANT_CONFIG_FILENAMES_FOR_SCAN.has(fileName)
    );
  }

  /**
   * Scans specified paths (which can be directories or individual files) recursively for relevant code files
   * and reads their content. Ensures file paths are absolute and also provides a path relative to the project root.
   * Handles multiple scan paths and deduplicates files.
   * This method uses specific hardcoded exclusion lists tailored for AI context building.
   *
   * @param scanPaths An array of paths (relative or absolute) to scan. Each path can be a directory or a file.
   * @param projectRoot The root directory of the project, used for calculating relative paths.
   * @param verbose If true, logs detailed information during scanning.
   * @returns A promise that resolves to an array of ScannedFile objects.
   */
  public async scan(
    scanPaths: string[],
    projectRoot: string,
    verbose: boolean = false,
  ): Promise<ScannedFileDto[]> {
    this.ensureFileModuleEnabled(); // Ensure module is enabled for this operation

    const allScannedFiles: ScannedFileDto[] = [];
    const processedAbsolutePaths = new Set<string>(); // To deduplicate files if multiple scan paths overlap

    this.logger.log(
      `Starting comprehensive file scan from project root: ${projectRoot}`,
    );
    if (verbose) {
      this.logger.debug(`Scan paths received: ${scanPaths.join(', ')}`);
    }

    for (const currentPath of scanPaths) {
      console.log(currentPath, 'currentPath');
      const absolutePath = path.resolve(projectRoot, currentPath);

      if (processedAbsolutePaths.has(absolutePath)) {
        if (verbose) {
          this.logger.debug(
            `  Skipping '${absolutePath}' (already processed).`,
          );
        }
        continue;
      }

      let stats: fsExtra.Stats;
      try {
        stats = await fsExtra.stat(absolutePath);
      } catch (error) {
        this.logger.error(
          `Error accessing path '${absolutePath}': ${(error as Error).message}. Skipping.`,
        );
        continue;
      }

      if (stats.isFile()) {
        try {
          const content = await fs.readFile(absolutePath, 'utf-8');
          const relativeToProjectRoot = path.relative(
            projectRoot,
            absolutePath,
          );
          allScannedFiles.push({
            filePath: absolutePath,
            relativePath: relativeToProjectRoot,
            content: content,
          });
          processedAbsolutePaths.add(absolutePath);
          if (verbose) {
            this.logger.debug(
              `  Included explicit file: ${relativeToProjectRoot}`,
            );
          }
        } catch (readError) {
          this.logger.warn(
            `Could not read explicit file '${absolutePath}': ${(readError as Error).message}`,
          );
        }
      } else if (stats.isDirectory()) {
        if (verbose) {
          this.logger.log(
            `  Initiating recursive scan for directory: ${absolutePath}`,
          );
        }
        const queue: string[] = [absolutePath];

        while (queue.length > 0) {
          const currentDir = queue.shift()!;
          let entries: Dirent[];
          try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
          } catch (error) {
            this.logger.error(
              `Error reading directory '${currentDir}': ${(error as Error).message}. Skipping.`,
            );
            continue;
          }

          for (const entry of entries) {
            const entryFullPath = path.join(currentDir, entry.name);
            const relativeToProjectRoot = path.relative(
              projectRoot,
              entryFullPath,
            );

            if (entry.isDirectory() && this.isExcludedDirForScan(entry.name)) {
              if (verbose) {
                this.logger.debug(
                  `    Excluding directory for scan: ${relativeToProjectRoot}`,
                );
              }
              continue;
            }

            if (entry.isFile() && this.isExcludedFileForScan(entry.name)) {
              if (verbose) {
                this.logger.debug(
                  `    Excluding file for scan: ${relativeToProjectRoot}`,
                );
              }
              continue;
            }

            if (entry.isDirectory()) {
              queue.push(entryFullPath);
            } else if (entry.isFile()) {
              const isIncluded = this.isRelevantFileForScan(entry.name);

              if (isIncluded) {
                if (!processedAbsolutePaths.has(entryFullPath)) {
                  try {
                    const content = await fs.readFile(entryFullPath, 'utf-8');
                    allScannedFiles.push({
                      filePath: entryFullPath,
                      relativePath: relativeToProjectRoot,
                      content: content,
                    });
                    processedAbsolutePaths.add(entryFullPath);
                    if (verbose) {
                      this.logger.debug(
                        `    Included for scan: ${relativeToProjectRoot}`,
                      );
                    }
                  } catch (readError) {
                    this.logger.warn(
                      `Could not read file '${entryFullPath}' for scan: ${(readError as Error).message}`,
                    );
                  }
                } else if (verbose) {
                  this.logger.debug(
                    `    Skipping for scan (already processed): ${relativeToProjectRoot}`,
                  );
                }
              } else {
                if (verbose) {
                  this.logger.debug(
                    `    Skipping file for scan: ${relativeToProjectRoot} (unsupported type)`,
                  );
                }
              }
            }
          }
        }
      } else {
        this.logger.warn(
          `'${absolutePath}' is neither a file nor a directory. Skipping for scan.`,
        );
      }
    }

    this.logger.log(
      `Comprehensive file scan completed. Found ${allScannedFiles.length} relevant files.`,
    );
    return allScannedFiles;
  }
  // --- END: New `scan` method and its specific helper methods ---

  /**
   * Reads a file buffer and returns its content along with metadata.
   */
  readFile(
    buffer: Buffer,
    filename: string,
    generateBlobUrl = false,
    filePath?: string,
  ): ReadFileResponseDto {
    const mimeType = mimeLookup(filename) || 'application/octet-stream';
    const lang = this.utilsService.detectLanguage(filename, mimeType);
    return {
      filePath,
      filename,
      mimeType,
      language: lang,
      content: generateBlobUrl
        ? `data:${mimeType};base64,${buffer.toString('base64')}`
        : buffer.toString('utf-8'),
    };
  }

  /**
   * Reads multiple file buffers and returns their contents along with metadata.
   */
  async readMultipleFiles(
    files: { buffer: Buffer; filename: string; filePath?: string }[],
    generateBlobUrl?: boolean,
  ): Promise<ReadFileResponseDto[]> {
    this.ensureFileModuleEnabled();

    return files.map((file) =>
      this.readFile(file.buffer, file.filename, generateBlobUrl, file.filePath),
    );
  }

  /**
   * Proxies an image from a given URL and pipes it to the response.
   */
  async proxyImage(url: string, res: Response): Promise<void> {
    this.ensureFileModuleEnabled();

    if (!url) throw new BadRequestException('Missing image URL');

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException(
          'Unsupported protocol. Only http and https are allowed.',
        );
      }
    } catch (error) {
      this.logger.error(
        `Invalid URL format for proxyImage: ${url}. Error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new BadRequestException('Invalid image URL format.');
    }

    const client = parsedUrl.protocol === 'https:' ? httpsGet : httpGet;
    try {
      await new Promise<void>((resolve, reject) => {
        client(url, (imageRes) => {
          const contentType = imageRes.headers['content-type'];
          if (contentType) {
            res.setHeader('Content-Type', contentType);
          } else {
            this.logger.warn(
              `No Content-Type header for URL: ${url}. Defaulting to image/jpeg.`,
            );
            res.setHeader('Content-Type', 'image/jpeg');
          }
          imageRes.pipe(res);
          imageRes.on('end', resolve);
          imageRes.on('error', (err) => {
            this.logger.error(
              `Error during image stream for URL: ${url}. Error: ${err.message}`,
              err.stack,
            );
            reject(err);
          });
        }).on('error', (err) => {
          this.logger.error(
            `Failed to initiate HTTP request for URL: ${url}. Error: ${err.message}`,
            err.stack,
          );
          reject(err);
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch or stream image: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Creates a new file or folder at the specified path.
   */
  async createLocalFileOrFolder(
    dto: CreateFileDto,
  ): Promise<{ success: boolean; filePath: string }> {
    this.ensureFileModuleEnabled();

    const { filePath, isDirectory, content } = dto;
    const resolvedPath = path.resolve(filePath);

    try {
      if (isDirectory) {
        await fs.mkdir(resolvedPath, { recursive: true });
        return { success: true, filePath: resolvedPath };
      } else {
        this.validateFileExtension(resolvedPath);
        const finalContent: string =
          content?.trim() === '' || content == null ? ' ' : content;
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, finalContent, 'utf-8');
        return { success: true, filePath: resolvedPath };
      }
    } catch (error) {
      this.logger.error(
        `Failed to create ${isDirectory ? 'folder' : 'file'} at ${resolvedPath}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to create ${isDirectory ? 'folder' : 'file'}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Writes content to a file at a specified path, creating parent directories if needed.
   */
  async writeLocalFileContent(
    filePath: string,
    content: string,
  ): Promise<{ success: boolean; message: string }> {
    this.ensureFileModuleEnabled();

    try {
      this.validateFileExtension(filePath);
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, message: 'File written successfully.' };
    } catch (error) {
      this.logger.error(
        `Failed to write file to ${filePath}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to write file: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Deletes a file or directory at the specified path.
   */
  async deleteLocalFile(
    filePath: string,
  ): Promise<{ success: boolean; message: string }> {
    this.ensureFileModuleEnabled();

    try {
      if (!(await fsExtra.pathExists(filePath))) {
        throw new NotFoundException(`Path not found: ${filePath}`);
      }
      await fsExtra.remove(filePath);
      return { success: true, message: `Successfully deleted: ${filePath}` };
    } catch (error) {
      this.logger.error(
        `Failed to delete ${filePath}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to delete ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Renames a file or folder at the specified oldPath to the newPath.
   */
  async renameLocalFileOrFolder(
    oldPath: string,
    newPath: string,
  ): Promise<{
    success: boolean;
    message: string;
    oldPath: string;
    newPath: string;
  }> {
    this.ensureFileModuleEnabled();

    const resolvedOldPath = path.resolve(oldPath);
    const resolvedNewPath = path.resolve(newPath);

    try {
      if (!(await fsExtra.pathExists(resolvedOldPath))) {
        throw new NotFoundException(
          `Source path does not exist: ${resolvedOldPath}`,
        );
      }

      if (await fsExtra.pathExists(resolvedNewPath)) {
        throw new BadRequestException(
          `Target path already exists: ${resolvedNewPath}`,
        );
      }

      await fsExtra.move(resolvedOldPath, resolvedNewPath);

      this.logger.log(`Renamed "${resolvedOldPath}" to "${resolvedNewPath}"`);

      return {
        success: true,
        message: `Successfully renamed "${resolvedOldPath}" to "${resolvedNewPath}"`,
        oldPath: resolvedOldPath,
        newPath: resolvedNewPath,
      };
    } catch (error) {
      this.logger.error(
        `Failed to rename "${resolvedOldPath}" to "${resolvedNewPath}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to rename file or folder: ${(error as Error).message}`,
      );
    }
  }

  async searchFilesByName(
    directory: string,
    searchTerm: string,
  ): Promise<
    {
      name: string;
      path: string;
      isDirectory: boolean;
      type: 'file' | 'folder';
    }[]
  > {
    this.ensureFileModuleEnabled();

    const resolvedDir = path.resolve(process.cwd(), directory);

    if (!(await fsExtra.pathExists(resolvedDir))) {
      throw new BadRequestException(`Directory not found: ${resolvedDir}`);
    }

    const results: {
      name: string;
      path: string;
      isDirectory: boolean;
      type: 'file' | 'folder';
    }[] = [];

    const walk = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        // Here, assuming this.EXCLUDED_FOLDERS are basenames for generic file browsing
        if (this.EXCLUDED_FOLDERS.includes(entry.name)) {
          this.logger.debug(
            `Skipping user-excluded folder during search: ${entry.name}`,
          );
          continue;
        }

        const fullPath = path.join(currentPath, entry.name);
        try {
          const isDir = entry.isDirectory();

          if (entry.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              name: entry.name,
              path: fullPath,
              isDirectory: isDir,
              type: isDir ? 'folder' : 'file',
            });
          }

          if (isDir) {
            await walk(fullPath);
          }
        } catch (error) {
          this.logger.warn(
            `Skipped "${fullPath}" during search due to error: ${(error as Error).message}`,
          );
        }
      }
    };

    await walk(resolvedDir);
    return results;
  }

  /**
   * Helper to format bytes into a human-readable string.
   */
  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
