import { Injectable, Logger, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJwtUserDto } from '../auth/dto/auth.dto';
import { File, FileType, Prisma } from '@prisma/client';
import { PaginationMediaQueryDto } from './dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly downloadDir = path.resolve(process.cwd(), 'downloads');
  private readonly cookiesDir = path.resolve(process.cwd(), 'cookies');
  private readonly audioDownloadBaseDir = path.join(this.downloadDir, 'audio');
  private readonly videoDownloadBaseDir = path.join(this.downloadDir, 'videos');

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: CreateJwtUserDto },
  ) {
    // Ensure base download directories exist
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
    if (!fs.existsSync(this.audioDownloadBaseDir)) {
      fs.mkdirSync(this.audioDownloadBaseDir, { recursive: true });
    }
    if (!fs.existsSync(this.videoDownloadBaseDir)) {
      fs.mkdirSync(this.videoDownloadBaseDir, { recursive: true });
    }
  }

  private get userId(): string {
    if (!this.request.user || !this.request.user.id) {
      throw new BadRequestException('User ID not found in request. Authentication is required.');
    }
    return this.request.user.id;
  }

  async extractAudioVideoFromYoutube(
    url: string,
    format: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv' = 'webm',
    onProgress?: (info: { percent: number; downloaded?: number; total?: number }) => void,
    onFilePathReady?: (filePath: string) => void,
    provider?: string,
    cookieAccess?: boolean,
  ): Promise<File> {
    return new Promise(async (resolve, reject) => {
      const isAudio = ['mp3', 'm4a', 'wav'].includes(format);
      const baseTypeDirName = isAudio ? 'audio' : 'videos';
      const providerName = provider || 'unknown';
      const currentUserId = this.userId; // Get user ID from request context

      // Construct the target directory: downloads/<audio|videos>/<provider>/<userId>
      const targetDirectoryPath = path.join(
        this.downloadDir,
        baseTypeDirName,
        providerName,
        currentUserId,
      );

      // Ensure the target directory exists
      await fs.promises.mkdir(targetDirectoryPath, { recursive: true });

      // yt-dlp output template using the dynamically created directory
      const outputTemplate = path.join(targetDirectoryPath, '%(title)s.%(ext)s');
      const args: string[] = [];

      // cookies if needed
      if (cookieAccess && provider) {
        const cookieFile = path.join(this.cookiesDir, `${provider}_cookies.txt`);
        if (fs.existsSync(cookieFile)) {
          args.push('--cookies', cookieFile);
        } else {
          this.logger.warn(`Cookie file not found for provider ${provider} at ${cookieFile}`);
          // You might want to reject here or handle this more gracefully if cookies are critical.
        }
      }

      // format args
      if (isAudio) {
        args.push('-x', '--audio-format', format);
      } else {
        // For video, ensure the best available video+audio is combined
        // '-f bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' for example
        args.push('-f', `bestvideo[ext=${format}]+bestaudio/best`);
      }
      args.push('-o', outputTemplate, url);

      this.logger.debug(`Spawning yt-dlp with arguments: yt-dlp ${args.join(' ')}`);

      const ytDlp = spawn('yt-dlp', args);
      let filePath: string | null = null;
      let filePathEmitted = false;
      let stderrBuffer = ''; // *** ADDED: To accumulate all stderr output ***

      // listen to stderr (yt-dlp writes progress & destination there, and errors!)
      ytDlp.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderrBuffer += text; // *** ADDED: Accumulate all stderr output ***

        for (const line of text.split('\n')) {
          // 1) progress lines: "[download]  12.3% of 4.56MiB at 123.45KiB/s"
          const prog = line.match(
            /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([\d.]+[KMG]?B)\s+at\s+([\d.]+[KMG]?B\/s)/,
          );
          if (prog && onProgress) {
            const percent = parseFloat(prog[1]);
            const totalSize = this.parseSize(prog[2]);
            const downloadedSize = (percent * totalSize) / 100;
            onProgress({
              percent,
              downloaded: downloadedSize,
              total: totalSize,
            });
          }

          // 2) destination line: "[download] Destination: file.webm" or "[ExtractAudio] Destination: file.mp3"
          // Ensure that the path from yt-dlp matches our expected absolute path.
          // yt-dlp usually outputs an absolute path if the -o argument uses an absolute path.
          const dest = line.match(
            isAudio ? /\[ExtractAudio\] Destination:\s+(.+)/ : /\[download\] Destination:\s+(.+)/,
          );
          if (dest && !filePathEmitted) {
            let resolved = dest[1].trim();
            // This fallback might be problematic if yt-dlp's cwd is not process.cwd().
            // Ideally, yt-dlp should output the absolute path when -o is absolute.
            // Consider logging `process.cwd()` vs `targetDirectoryPath` difference if issues persist.
            if (!path.isAbsolute(resolved)) {
              this.logger.warn(`yt-dlp reported relative path: ${resolved}. Attempting to resolve against CWD.`);
              resolved = path.join(process.cwd(), resolved);
            }
            filePath = resolved;
            filePathEmitted = true;
            if (onFilePathReady) {
              onFilePathReady(resolved);
            }
          }
        }
      });

      ytDlp.on('error', (err) => {
        // This 'error' event is typically for issues spawning the process itself (e.g., 'yt-dlp' not found)
        this.logger.error('yt-dlp failed to start (process spawn error)', err);
        reject(new Error(`Failed to start yt-dlp process: ${err.message}`));
      });

      ytDlp.on('close', async (code) => {
        if (code === 0 && filePath) {
          try {
            // Save file and folder information to Prisma
            const createdFile = await this.saveMediaFileToPrisma(
              filePath,
              url,
              format,
              providerName,
              currentUserId,
            );
            resolve(createdFile);
          } catch (prismaError) {
            this.logger.error(`Download successful but failed to save media metadata to Prisma: ${prismaError.message}`);
            // Reject with a more specific error for metadata saving failure
            reject(
              new Error(`Download successful but failed to save metadata: ${prismaError.message}`),
            );
          }
        } else {
          // *** MODIFIED: Include stderrBuffer in the error message ***
          const errorMessage = `yt-dlp exited with code ${code}. Stderr: ${stderrBuffer || 'No stderr output captured.'}`;
          this.logger.error(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }

  // ... (rest of your MediaService class remains the same)

  private async saveMediaFileToPrisma(
    absoluteFilePath: string,
    originalUrl: string,
    mediaFormat: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv',
    provider: string | undefined,
    userId: string,
  ): Promise<File> {
    const isAudio = ['mp3', 'm4a', 'wav'].includes(mediaFormat);
    const baseTypeDirName = isAudio ? 'audio' : 'videos';

    // Get file stats for size
    const fileStats = await fs.promises.stat(absoluteFilePath);
    const fileSize = BigInt(fileStats.size);

    // Determine file name and extension
    const fileNameWithExt = path.basename(absoluteFilePath);
    const fileExtension = path.extname(absoluteFilePath).slice(1);

    // Determine FileType enum value
    let fileType: FileType;
    if (isAudio) {
      fileType = FileType.AUDIO;
    } else if (['mp4', 'webm', 'flv'].includes(mediaFormat)) {
      fileType = FileType.VIDEO;
    } else {
      fileType = FileType.OTHER;
    }

    // Determine MIME type (simple guess, can be improved with 'mime-types' package if needed)
    let mimeType: string | undefined;
    if (fileExtension === 'mp3') mimeType = 'audio/mpeg';
    else if (fileExtension === 'm4a') mimeType = 'audio/mp4';
    else if (fileExtension === 'wav') mimeType = 'audio/wav';
    else if (fileExtension === 'webm') mimeType = 'video/webm';
    else if (fileExtension === 'mp4') mimeType = 'video/mp4';
    else if (fileExtension === 'flv') mimeType = 'video/x-flv';
    else mimeType = 'application/octet-stream';

    // Logic to create parent folders in Prisma if they don't exist
    let currentParentFolderId: string | null = null;
    let currentAbsolutePath = this.downloadDir; // Start from 'downloads' directory
    const pathSegments = [baseTypeDirName, provider || 'unknown', userId];

    // Create/find 'downloads' folder if it is considered part of the hierarchy in DB
    // For this specific request, we start creating from 'audio' or 'videos'
    let downloadsFolder = await this.prisma.folder.findFirst({
      where: { path: this.downloadDir, createdById: userId, parentId: null }, // Assuming 'downloads' is a root folder for user's media
    });

    if (downloadsFolder) {
      currentParentFolderId = downloadsFolder.id;
    } else {
      downloadsFolder = await this.prisma.folder.create({
        data: {
          name: 'downloads',
          path: this.downloadDir,
          createdById: userId,
          parentId: null,
        },
      });
      this.logger.log(`Created root 'downloads' folder in Prisma: ${downloadsFolder.path}`);
      currentParentFolderId = downloadsFolder.id;
    }

    for (const segment of pathSegments) {
      currentAbsolutePath = path.join(currentAbsolutePath, segment);
      let folder = await this.prisma.folder.findFirst({
        where: { path: currentAbsolutePath, createdById: userId },
      });

      if (!folder) {
        folder = await this.prisma.folder.create({
          data: {
            name: segment,
            path: currentAbsolutePath, // Store the absolute path
            createdById: userId,
            parentId: currentParentFolderId,
          },
        });
        this.logger.log(`Created folder in Prisma: ${folder.path}`);
      }
      currentParentFolderId = folder.id;
    }

    // Create the File entry in Prisma
    const file = await this.prisma.file.create({
      data: {
        name: fileNameWithExt,
        path: absoluteFilePath, // Store the absolute path of the actual file on disk
        fileType: fileType,
        mimeType: mimeType,
        size: fileSize,
        provider: provider,
        url: originalUrl,
        createdById: userId,
        folderId: currentParentFolderId, // Link to the most specific folder
      },
    });
    this.logger.log(`Created file entry in Prisma: ${file.path}`);

    return file;
  }

  async findAllPaginated(
    query: PaginationMediaQueryDto,
    select?: Prisma.FileSelect,
  ): Promise<{ items: File[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = query.page ?? 1;
    const pageSize = Number(query.pageSize) ?? 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where: { ...where, createdById: this.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.file.count({ where: { ...where, createdById: this.userId } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { id, createdById: this.userId },
    });
  }

  async remove(id: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id, createdById: this.userId },
    });

    if (!file) {
      throw new NotFoundException(`Media file with ID ${id} not found or unauthorized.`);
    }

    // Delete the physical file from disk
    try {
      if (fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
        this.logger.log(`Successfully deleted physical file: ${file.path}`);
      } else {
        this.logger.warn(`Physical file not found at ${file.path}, deleting database entry only.`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete physical file ${file.path}: ${error.message}`);
      // Depending on requirements, you might still want to delete the DB entry even if physical deletion fails
    }

    // Delete the database entry
    return this.prisma.file.delete({ where: { id } });
  }

  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1 << 10,
      MB: 1 << 20,
      GB: 1 << 30,
    };
    const m = sizeStr.match(/([\d.]+)([KMG]?B)/);
    if (!m) return 0;
    return parseFloat(m[1]) * (units[m[2]] || 1);
  }

  private buildWhereFromQuery(query: PaginationMediaQueryDto): Prisma.FileWhereInput {
    const where: Prisma.FileWhereInput = {};

    if (query.name !== undefined) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    if (query.fileType !== undefined) {
      where.fileType = query.fileType;
    }
    if (query.provider !== undefined) {
      where.provider = { contains: query.provider, mode: 'insensitive' };
    }
    if (query.url !== undefined) {
      where.url = { contains: query.url, mode: 'insensitive' };
    }
    if (query.folderId !== undefined) {
      where.folderId = query.folderId;
    }

    return where;
  }
}
