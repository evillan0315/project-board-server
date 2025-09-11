import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJwtUserDto } from '../auth/dto/auth.dto';
import { File, FileType, Prisma, MetadataType } from '@prisma/client';
import {
  PaginationMediaQueryDto,
  MediaScanRequestDto,
  MediaScanResponseDto,
} from './dto';
import * as recursiveReaddir from 'recursive-readdir';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Define supported media extensions and map them to FileType
const MEDIA_EXTENSIONS: Record<string, FileType> = {
  '.mp3': FileType.AUDIO,
  '.wav': FileType.AUDIO,
  '.flac': FileType.AUDIO,
  '.aac': FileType.AUDIO,
  '.ogg': FileType.AUDIO,
  '.m4a': FileType.AUDIO,
  '.mp4': FileType.VIDEO,
  '.webm': FileType.VIDEO,
  '.mov': FileType.VIDEO,
  '.avi': FileType.VIDEO,
  '.flv': FileType.VIDEO,
  '.mkv': FileType.VIDEO,
  '.jpg': FileType.IMAGE,
  '.jpeg': FileType.IMAGE,
  '.png': FileType.IMAGE,
  '.gif': FileType.IMAGE,
  '.bmp': FileType.IMAGE,
  '.webp': FileType.IMAGE,
  '.tiff': FileType.IMAGE,
};

// Basic MIME type mapping
const MIME_TYPES_MAP: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.flv': 'video/x-flv',
  '.mkv': 'video/x-matroska',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.tiff': 'image/tiff',
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly downloadDir = path.resolve(process.cwd(), 'downloads');
  private readonly cookiesDir = path.resolve(process.cwd(), 'cookies');
  private readonly thumbnailDir = path.join(this.downloadDir, 'thumbnails'); // New: Thumbnail directory

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {
    // Ensure the root download directory exists
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
      this.logger.log(`Created root download directory: ${this.downloadDir}`);
    }
    // Ensure the thumbnail directory exists
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
      this.logger.log(`Created thumbnail directory: ${this.thumbnailDir}`);
    }
  }

  private get userId(): string {
    if (!this.request.user || !this.request.user.id) {
      throw new BadRequestException(
        'User ID not found in request. Authentication is required.',
      );
    }
    return this.request.user.id;
  }
  private async fetchYoutubeMetadata(url: string, cookieFile?: string) {
    return new Promise<any>((resolve, reject) => {
      const args = ['-j', url];
      if (cookieFile) {
        args.push('--cookies', cookieFile);
      }

      const proc = spawn('yt-dlp', args);
      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => (output += data.toString()));
      proc.stderr.on('data', (data) => (errorOutput += data.toString()));
      proc.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (err) {
            reject(new Error(`Failed to parse metadata JSON: ${err.message}`));
          }
        } else {
          reject(
            new Error(
              `yt-dlp metadata exited with ${code}. Stderr: ${errorOutput}`,
            ),
          );
        }
      });
    });
  }

  // Helper function to check command versions and capture output
  private checkVersion = (command: string, args: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(
            new Error(
              `${command} exited with code ${code}. Stderr: ${errorOutput}`,
            ),
          );
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn ${command} process: ${err.message}`));
      });
    });
  };

  /**
   * Generates a thumbnail from a video file using FFmpeg.
   * @param videoFilePath The absolute path to the video file.
   * @param fileId The unique ID of the file, used for the thumbnail's filename.
   * @param userId The ID of the user, used for organizing thumbnails.
   * @returns A Promise that resolves to the absolute path of the generated thumbnail, or null if generation fails.
   */
  private async _generateThumbnail(
    videoFilePath: string,
    fileId: string,
    userId: string,
  ): Promise<string | null> {
    const userThumbnailDir = path.join(this.thumbnailDir, userId);
    await fs.promises.mkdir(userThumbnailDir, { recursive: true });

    const thumbnailFileName = `${fileId}.jpg`;
    const thumbnailPath = path.join(userThumbnailDir, thumbnailFileName);

    this.logger.log(`Attempting to generate thumbnail for ${videoFilePath} at ${thumbnailPath}`);

    return new Promise((resolve) => {
      // ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 -q:v 2 output.jpg
      const ffmpegArgs = [
        '-i', videoFilePath,
        '-ss', '00:00:01', // Seek to 1 second
        '-vframes', '1', // Take one frame
        '-q:v', '2', // Quality (1-5, 1 being best, 5 worst)
        thumbnailPath,
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      let stderrOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`Thumbnail generated successfully: ${thumbnailPath}`);
          resolve(thumbnailPath);
        } else {
          this.logger.error(
            `FFmpeg failed to generate thumbnail for ${videoFilePath}. Code: ${code}. Stderr: ${stderrOutput}`,
          );
          resolve(null); // Return null on failure
        }
      });

      ffmpeg.on('error', (err) => {
        this.logger.error(
          `Failed to spawn FFmpeg process for ${videoFilePath}: ${err.message}`,
        );
        resolve(null); // Return null on process spawn error
      });
    });
  }

  async extractAudioVideoFromYoutube(
    url: string,
    format: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv' = 'webm',
    onProgress?: (info: {
      percent: number;
      downloaded?: number;
      total?: number;
    }) => void,
    onFilePathReady?: (filePath: string) => void,
    provider?: string,
    cookieAccess?: boolean,
  ): Promise<File> {
    return new Promise(async (resolve, reject) => {
      const isAudio = ['mp3', 'm4a', 'wav'].includes(format);
      const baseTypeDirName = isAudio ? 'audio' : 'videos';
      const providerName = provider || 'unknown';
      const currentUserId = this.userId;

      // Construct the target directory: downloads/<audio|videos>/<provider>/<userId>
      const targetDirectoryPath = path.join(
        this.downloadDir,
        baseTypeDirName,
        providerName,
        currentUserId,
      );

      // Ensure the target directory exists
      await fs.promises.mkdir(targetDirectoryPath, { recursive: true });

      // Generate a unique file ID upfront to use for both the file and its potential thumbnail
      const fileId = uuidv4();
      const outputTemplate = path.join(
        targetDirectoryPath,
        fileId + '.%(ext)s', // Use the fileId as part of the filename, yt-dlp will append original extension
      );
      const args: string[] = [];

      // Check yt-dlp, python, and ffmpeg versions for logging/debugging
      try {
        const ytVersion = await this.checkVersion('yt-dlp', ['--version']);
        const pythonVersion = await this.checkVersion('python', ['--version']);
        const ffmpegVersion = await this.checkVersion('ffmpeg', ['-version']); // Check ffmpeg version
        this.logger.debug(`yt-dlp version: ${ytVersion}`);
        this.logger.debug(`Python version: ${pythonVersion}`);
        this.logger.debug(`FFmpeg version: ${ffmpegVersion.split('\n')[0]}`); // Only take first line of ffmpeg version
      } catch (err) {
        this.logger.warn(`Failed to get tool versions: ${err.message}`);
        // Decide if this is a fatal error or just a warning.
        // For now, we'll log and continue, but you might want to `reject` if tools are critical.
      }
      let metadataFromYtDlp: any;
      // cookies if needed
      if (cookieAccess && provider) {
        const cookieFile = path.join(
          this.cookiesDir,
          `${provider}_cookies.txt`,
        );

        try {
          metadataFromYtDlp = await this.fetchYoutubeMetadata(url, cookieFile);
          this.logger.debug(`Fetched metadata for ${url}: ${metadataFromYtDlp.title}`);
        } catch (err) {
          this.logger.warn(`Failed to fetch metadata: ${err.message}`);
        }
        if (fs.existsSync(cookieFile)) {
          args.push('--cookies', cookieFile);
        } else {
          this.logger.warn(
            `Cookie file not found for provider ${provider} at ${cookieFile}`,
          );
        }
      }
      // 1) Fetch metadata first

      // format args
      if (isAudio) {
        args.push('-x', '--audio-format', format);
      } else {
        // For video, ensure the best available video+audio is combined
        // '-f bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' for example
        args.push('-f', `bestvideo[ext=${format}]+bestaudio/best`);
      }
      args.push('-o', outputTemplate, url);

      this.logger.debug(
        `Spawning yt-dlp with arguments: yt-dlp ${args.join(' ')}`,
      );

      const ytDlp = spawn('yt-dlp', args);

      let actualFilePath: string | null = null; // Store the actual downloaded file path
      let filePathEmitted = false;
      let stderrBuffer = '';
      const handleOutput = (text: string) => {
        stderrBuffer += text;

        for (const line of text.split('\n')) {
          // 1) progress lines
          const prog = line.match(
            /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([\d.]+[KMGTP]?i?B).*/,
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

          // 2) destination line
          const dest =
            line.match(
              isAudio
                ? /\[ExtractAudio\] Destination:\s+(.+)/
                : /\[download\] Destination:\s+(.+)/,
            ) ||
            line.match(/\[download\]\s+(.+)\s+has already been downloaded/);

          if (dest && !filePathEmitted) {
            let resolved = dest[1].trim();
            if (!path.isAbsolute(resolved)) {
              this.logger.warn(
                `yt-dlp reported relative path: ${resolved}. Resolving against CWD.`,
              );
              resolved = path.join(process.cwd(), resolved);
            }
            actualFilePath = resolved;
            filePathEmitted = true;
            if (onFilePathReady) {
              onFilePathReady(resolved);
            }
          }
        }
      };
      // listen to stderr (yt-dlp writes progress & destination there, and errors!)
      ytDlp.stderr.on('data', (chunk: Buffer) =>
        handleOutput(chunk.toString()),
      );
      ytDlp.stdout.on('data', (chunk: Buffer) =>
        handleOutput(chunk.toString()),
      );
      ytDlp.on('error', (err) => {
        // This 'error' event is typically for issues spawning the process itself (e.g., 'yt-dlp' not found)
        this.logger.error('yt-dlp failed to start (process spawn error)', err);
        reject(new Error(`Failed to start yt-dlp process: ${err.message}`));
      });

      ytDlp.on('close', async (code) => {
        if (code === 0 && actualFilePath) {
          try {
            let thumbnailUrl: string | null = null;
            const fileType = isAudio ? FileType.AUDIO : FileType.VIDEO; // Determine fileType based on isAudio
            if (fileType === FileType.VIDEO) {
              thumbnailUrl = await this._generateThumbnail(actualFilePath, fileId, currentUserId);
            }
            const createdFile = await this.saveMediaFileToPrisma(
              fileId, // Pass the pre-generated fileId
              actualFilePath,
              url, // Original YouTube URL
              format, // Desired media format
              providerName,
              currentUserId,
              metadataFromYtDlp,
              thumbnailUrl, // Pass the generated thumbnail URL
            );
            resolve(createdFile);
          } catch (prismaError) {
            this.logger.error(
              `Download successful but failed to save media metadata to Prisma: ${prismaError.message}`,
            );
            // Reject with a more specific error for metadata saving failure
            reject(
              new Error(
                `Download successful but failed to save metadata: ${prismaError.message}`,
              ),
            );
          }
        } else {
          const errorMessage = `yt-dlp exited with code ${code}. Stderr: ${stderrBuffer || 'No stderr output captured.'}`;
          this.logger.error(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * Saves media file and its parent folders to Prisma.
   * This is used for media extracted from external URLs (e.g., YouTube).
   */
  private async saveMediaFileToPrisma(
    fileId: string, // Unique ID for the file, generated upfront
    absoluteFilePath: string,
    originalUrl: string, // The original URL from which the media was extracted
    mediaFormat: 'mp3' | 'webm' | 'm4a' | 'wav' | 'mp4' | 'flv', // The format yt-dlp was instructed to use
    provider: string | undefined,
    userId: string,
    metadataFromYtDlp?: any, // Metadata fetched directly from yt-dlp
    thumbnailUrl?: string | null, // Locally generated thumbnail URL
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
      this.logger.log(
        `Created root 'downloads' folder in Prisma: ${downloadsFolder.path}`,
      );
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

    // Prepare metadata for Prisma
    const fileMetadataData: Prisma.InputJsonValue = {
      title: metadataFromYtDlp?.title,
      duration: metadataFromYtDlp?.duration,
      uploader: metadataFromYtDlp?.uploader,
      // Prefer yt-dlp's thumbnail URL if available, otherwise use our locally generated one
      thumbnail: metadataFromYtDlp?.thumbnails?.[0]?.url || thumbnailUrl,
    };

    // Create the File entry in Prisma
    const file = await this.prisma.file.create({
      data: {
        id: fileId, // Use the pre-generated fileId
        name: fileNameWithExt,
        path: absoluteFilePath,
        fileType: fileType,
        mimeType: mimeType,
        size: fileSize,
        provider: provider,
        url: originalUrl,
        createdById: userId,
        folderId: currentParentFolderId,
        metadata: {
          create: {
            type: fileType,
            data: fileMetadataData,
            tags: ['youtube', provider].filter(Boolean) as string[], // Filter out undefined provider
          },
        },
      },
      include: { metadata: true },
    });
    this.logger.log(`Created file entry in Prisma: ${file.path}`);

    return file;
  }

  /**
   * Scans a specified directory for media files and adds them to the database.
   * @param requestDto The DTO containing the directory path to scan.
   * @returns A promise that resolves to a MediaScanResponseDto.
   */
  async scanDirectoryForMedia(
    requestDto: MediaScanRequestDto,
  ): Promise<MediaScanResponseDto> {
    const { directoryPath } = requestDto;
    const userId = this.userId;
    const errors: string[] = [];
    let scannedFilesCount = 0;

    this.logger.log(`Scanning directory: ${directoryPath} for user: ${userId}`);

    // Validate directory path
    if (!path.isAbsolute(directoryPath)) {
      throw new BadRequestException('Directory path must be absolute.');
    }
    if (!fs.existsSync(directoryPath)) {
      throw new BadRequestException('Directory does not exist.');
    }
    if (!(await fs.promises.stat(directoryPath)).isDirectory()) {
      throw new BadRequestException('Path is not a directory.');
    }

    // Basic security check: prevent scanning root or highly sensitive directories
    const forbiddenPaths = ['/etc', '/boot', '/usr', '/var', '/dev', '/proc', '/sys', '/node_modules',  'C:\\', 'C:\\Windows', 'C:\\Program Files'];
    if (forbiddenPaths.some(p => path.normalize(directoryPath).startsWith(path.normalize(p)))) {
        throw new BadRequestException('Scanning of this directory is not allowed for security reasons.');
    }

    try {
      // Check ffmpeg version here, as it might be needed for scanned videos
      let ffmpegAvailable = false;
      try {
        const ffmpegVersion = await this.checkVersion('ffmpeg', ['-version']);
        this.logger.debug(`FFmpeg version for scan: ${ffmpegVersion.split('\n')[0]}`);
        ffmpegAvailable = true;
      } catch (err) {
        this.logger.warn(`FFmpeg not found or failed to check version for scan: ${err.message}. Video thumbnails will not be generated.`);
        // Don't throw, just log and continue without thumbnail generation for scans
      }

      const filesInDirectory = await recursiveReaddir(directoryPath);
      this.logger.debug(`Found ${filesInDirectory.length} potential files in ${directoryPath}`);
      
      for (const filePath of filesInDirectory) {
        const fileExtension = path.extname(filePath).toLowerCase();
        
        const fileType = MEDIA_EXTENSIONS[fileExtension];
        this.logger.log(`Found file type ${fileType || 'UNKNOWN'} for file: ${filePath}`);

        if (fileType) {
          try {
            // Generate a unique file ID upfront for scanned files
            const fileId = uuidv4();
            const savedFile = await this._saveScannedMediaFileToPrisma(
              fileId, // Pass the pre-generated fileId
              filePath,
              fileType,
              userId,
              directoryPath,
              ffmpegAvailable, // Pass ffmpeg availability
            );
            if (savedFile) {
              scannedFilesCount++;
            }
          } catch (fileError) {
            this.logger.error(
              `Failed to process file ${filePath}: ${fileError.message}`,
            );
            errors.push(`Failed to process ${filePath}: ${fileError.message}`);
          }
        }
      }

      const success = errors.length === 0;
      const message = success
        ? `Successfully scanned directory. Found ${scannedFilesCount} new media files.`
        : `Scanned directory with ${scannedFilesCount} new media files, but encountered ${errors.length} errors.`;

      return { success, message, scannedFilesCount, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      this.logger.error(
        `Error during directory scan for ${directoryPath}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to scan directory: ${error.message}`,
      );
    }
  }

  /**
   * Saves a locally scanned media file and its parent folders to Prisma.
   * This is a more generic version compared to saveMediaFileToPrisma which is YouTube specific.
   * It also includes a check to prevent duplicate file paths for the same user.
   */
  private async _saveScannedMediaFileToPrisma(
    fileId: string, // Unique ID for the file, generated upfront
    absoluteFilePath: string,
    fileType: FileType,
    userId: string,
    baseScanDirectory: string, // The root directory from which the scan started
    ffmpegAvailable: boolean, // Indicates if ffmpeg is available for thumbnail generation
  ): Promise<File | null> {
    // Check if a file with this path already exists for this user
    const existingFile = await this.prisma.file.findFirst({
      where: {
        path: absoluteFilePath,
        createdById: userId,
      },
    });

    if (existingFile) {
      this.logger.debug(`File already exists in DB, skipping: ${absoluteFilePath}`);
      return null; // Skip if already exists
    }

    const fileStats = await fs.promises.stat(absoluteFilePath);
    const fileSize = BigInt(fileStats.size);
    const fileNameWithExt = path.basename(absoluteFilePath);
    const fileExtension = path.extname(absoluteFilePath).toLowerCase();
    const mimeType = MIME_TYPES_MAP[fileExtension] || 'application/octet-stream';

    // Build folder hierarchy in Prisma relative to `baseScanDirectory`
    let currentParentFolderId: string | null = null;
    let currentPathSegment = baseScanDirectory;

    // Find or create the baseScanDirectory as a root or child of 'downloads'
    let rootScanFolder = await this.prisma.folder.findFirst({
      where: { path: baseScanDirectory, createdById: userId },
    });

    if (!rootScanFolder) {
      // Logic to create a 'scans' root folder under 'downloads' if it doesn't exist
      // This provides a logical grouping for scanned content, separate from yt-dlp downloads
      let downloadsFolder = await this.prisma.folder.findFirst({
        where: { path: this.downloadDir, createdById: userId, parentId: null },
      });

      if (!downloadsFolder) {
        downloadsFolder = await this.prisma.folder.create({
          data: {
            name: 'downloads',
            path: this.downloadDir,
            createdById: userId,
            parentId: null,
          },
        });
        this.logger.log(`Created root 'downloads' folder in Prisma: ${downloadsFolder.path}`);
      }

      const scansDirPath = path.join(this.downloadDir, 'scans');
      let scansFolder = await this.prisma.folder.findFirst({
        where: { path: scansDirPath, createdById: userId, parentId: downloadsFolder.id },
      });

      if (!scansFolder) {
        scansFolder = await this.prisma.folder.create({
          data: {
            name: 'scans',
            path: scansDirPath,
            createdById: userId,
            parentId: downloadsFolder.id,
          },
        });
        this.logger.log(`Created 'scans' sub-folder under 'downloads': ${scansFolder.path}`);
      }

      // Now create the actual baseScanDirectory under 'scans'
      rootScanFolder = await this.prisma.folder.create({
        data: {
          name: path.basename(baseScanDirectory),
          path: baseScanDirectory,
          createdById: userId,
          parentId: scansFolder.id,
        },
      });
      this.logger.log(`Created base scan folder in Prisma: ${rootScanFolder.path}`);
    }
    currentParentFolderId = rootScanFolder.id;
    currentPathSegment = baseScanDirectory;

    const relativeFilePath = path.relative(baseScanDirectory, absoluteFilePath);
    const dirName = path.dirname(relativeFilePath);
    const folderSegments = dirName.split(path.sep).filter(segment => segment !== '.');

    for (const segment of folderSegments) {
      currentPathSegment = path.join(currentPathSegment, segment);
      let folder = await this.prisma.folder.findFirst({
        where: { path: currentPathSegment, createdById: userId, parentId: currentParentFolderId },
      });

      if (!folder) {
        folder = await this.prisma.folder.create({
          data: {
            name: segment,
            path: currentPathSegment,
            createdById: userId,
            parentId: currentParentFolderId,
          },
        });
        this.logger.log(`Created sub-folder in Prisma: ${folder.path}`);
      }
      currentParentFolderId = folder.id;
    }

    let thumbnailUrl: string | null = null;
    if (fileType === FileType.VIDEO && ffmpegAvailable) {
      thumbnailUrl = await this._generateThumbnail(absoluteFilePath, fileId, userId);
    }

    const file = await this.prisma.file.create({
      data: {
        id: fileId, // Use the pre-generated fileId
        name: fileNameWithExt,
        path: absoluteFilePath,
        fileType: fileType,
        mimeType: mimeType,
        size: fileSize,
        provider: 'local',
        createdById: userId,
        folderId: currentParentFolderId,
        metadata: {
          create: {
            type: fileType,
            data: {
              title: fileNameWithExt,
              thumbnail: thumbnailUrl, // Add thumbnail URL to metadata
            },
            tags: ['local', 'scanned'],
          },
        },
      },
      include: { metadata: true },
    });
    this.logger.log(`Created file entry from scan in Prisma: ${file.path}`);
    return file;
  }

  async findAllPaginated(
    query: PaginationMediaQueryDto,
    select?: Prisma.FileSelect,
  ): Promise<{
    items: File[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = Number(query.pageSize) ?? 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    // Always use `select` to avoid TS conflict
    const finalSelect: Prisma.FileSelect = {
      ...(select ?? {
        id: true,
        name: true,
        path: true,
        fileType: true,
        mimeType: true,
        size: true,
        provider: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      }),
      metadata: true, // ensure metadata always included
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where: { ...where, createdById: this.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: finalSelect,
      }),
      this.prisma.file.count({
        where: { ...where, createdById: this.userId },
      }),
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
      include: { metadata: true }, // Include metadata for consistent response
    });
  }

  async remove(id: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id, createdById: this.userId },
      include: { metadata: true }, // Include metadata to check for thumbnail
    });

    if (!file) {
      throw new NotFoundException(
        `Media file with ID ${id} not found or unauthorized.`,
      );
    }

    // Delete the physical media file from disk
    try {
      if (fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
        this.logger.log(`Successfully deleted physical media file: ${file.path}`);
      } else {
        this.logger.warn(
          `Physical media file not found at ${file.path}, deleting database entry only.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete physical media file ${file.path}: ${error.message}`,
      );
    }

    // Delete the associated thumbnail file, if it exists in metadata
    const thumbnailMetadata = file.metadata.find(
      (m) =>
        m.data &&
        typeof m.data === 'object' &&
        m.data !== null &&
        'thumbnail' in m.data,
    );

    if (thumbnailMetadata) {
      const thumbnailPath = (thumbnailMetadata.data as any)['thumbnail'] as string;
      // Ensure the thumbnail path is within the designated thumbnail directory for safety
      if (thumbnailPath && thumbnailPath.startsWith(this.thumbnailDir) && fs.existsSync(thumbnailPath)) {
          try {
              await fs.promises.unlink(thumbnailPath);
              this.logger.log(`Successfully deleted thumbnail file: ${thumbnailPath}`);
          } catch (error) {
              this.logger.error(
                  `Failed to delete thumbnail file ${thumbnailPath}: ${error.message}`,
              );
          }
      } else if (thumbnailPath && !thumbnailPath.startsWith(this.thumbnailDir)) {
          this.logger.warn(`Thumbnail path '${thumbnailPath}' is outside the expected thumbnail directory. Skipping deletion for safety.`);
      }
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

  private buildWhereFromQuery(
    query: PaginationMediaQueryDto,
  ): Prisma.FileWhereInput {
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
