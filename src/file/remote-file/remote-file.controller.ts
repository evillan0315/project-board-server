import {
  Controller,
  Get,
  Query,
  InternalServerErrorException,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  Body,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RemoteFileService } from './remote-file.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { readFileSync, existsSync, createReadStream, unlinkSync } from 'fs';

import { Response } from 'express';
import * as pathModule from 'path';
import { join } from 'path';

import { RemoteFileListDto } from './dto/remote-file-list.dto';
import { RemoteFileContentDto } from './dto/remote-file-content.dto';
class CommandDto {
  @ApiProperty({
    description: 'Shell command to execute on remote server',
    example: 'ls -la /var/www',
  })
  command: string;
}
class CommandResultDto {
  @ApiProperty({
    description: 'Standard output from the command',
    example: `total 12
drwxr-xr-x  3 root root 4096 Jun 25 12:00 .
drwxr-xr-x 20 root root 4096 Jun 25 12:00 ..
-rw-r--r--  1 root root    0 Jun 25 12:00 index.html`,
  })
  stdout: string;

  @ApiProperty({
    description: 'Standard error from the command',
    example: '',
  })
  stderr: string;
}
@ApiTags('Remote Files')
@Controller('remote')
export class RemoteFileController {
  constructor(
    private readonly remoteFileService: RemoteFileService,
    private readonly configService: ConfigService,
  ) {}

  @Get('list')
  @ApiOperation({
    summary: 'List files and directories on remote server',
    description:
      'Connects via SSH/SFTP to the remote server and lists files and directories at the specified path, recursively.',
  })
  @ApiQuery({
    name: 'path',
    type: String,
    required: false,
    description: 'Remote directory path to list (defaults to `/` if omitted)',
    example: '/var/www',
  })
  @ApiQuery({
    name: 'maxDepth',
    type: Number,
    required: false,
    description: 'Maximum recursion depth (default: unlimited)',
    example: 3,
  })
  @ApiQuery({
    name: 'maxFiles',
    type: Number,
    required: false,
    description: 'Maximum number of files to list (default: unlimited)',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved list of files and directories',
    type: RemoteFileListDto,
  })
  @ApiResponse({
    status: 500,
    description: 'SSH connection or SFTP operation failed',
  })
  async list(
    @Query('path') path?: string,
    @Query('maxDepth', ParseIntPipe) maxDepth?: number,
    @Query('maxFiles', ParseIntPipe) maxFiles?: number,
  ): Promise<RemoteFileListDto> {
    const sshConfig = this.loadSshConfig();

    return this.remoteFileService.listFilesAndDirectories(
      sshConfig,
      path || '/',
      {
        maxDepth: maxDepth ?? Infinity,
        maxFiles: maxFiles ?? Infinity,
      },
    );
  }

  @Post('file')
  @ApiOperation({ summary: 'Create a new file on remote server' })
  @ApiQuery({
    name: 'path',
    type: String,
    description: 'Remote file path to create',
    example: '/var/www/newfile.txt',
  })
  @ApiBody({
    type: RemoteFileContentDto,
    description: 'Content to write to the file',
  })
  @ApiResponse({ status: 201, description: 'File created' })
  async createFile(
    @Query('path') path: string,
    @Body() body: RemoteFileContentDto,
  ) {
    await this.remoteFileService.createOrUpdateFile(
      this.loadSshConfig(),
      path,
      body.content,
    );
  }

  @Put('file')
  @ApiOperation({ summary: 'Update an existing file on remote server' })
  @ApiQuery({
    name: 'path',
    type: String,
    description: 'Remote file path to update',
    example: '/var/www/existingfile.txt',
  })
  @ApiBody({
    type: RemoteFileContentDto,
    description: 'New content to overwrite the file',
  })
  @ApiResponse({ status: 200, description: 'File updated' })
  async updateFile(
    @Query('path') path: string,
    @Body() body: RemoteFileContentDto,
  ) {
    await this.remoteFileService.createOrUpdateFile(
      this.loadSshConfig(),
      path,
      body.content,
    );
  }

  @Delete('file')
  @ApiOperation({ summary: 'Delete a file on remote server' })
  @ApiQuery({
    name: 'path',
    type: String,
    description: 'Remote file path to delete',
    example: '/var/www/deletethis.txt',
  })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async deleteFile(@Query('path') path: string) {
    await this.remoteFileService.deleteFile(this.loadSshConfig(), path);
  }

  @Post('command')
  @ApiOperation({
    summary: 'Run a shell command on the remote server',
    description:
      'Executes the specified shell command via SSH and returns its output.',
  })
  @ApiBody({
    type: CommandDto,
    description: 'The command to execute on the remote server',
  })
  @ApiResponse({
    status: 200,
    description: 'Command executed successfully',
    type: CommandResultDto,
    schema: {
      example: {
        stdout: `total 12
drwxr-xr-x  3 root root 4096 Jun 25 12:00 .
drwxr-xr-x 20 root root 4096 Jun 25 12:00 ..
-rw-r--r--  1 root root    0 Jun 25 12:00 index.html`,
        stderr: '',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'SSH connection or command execution failed',
  })
  async runCommand(@Body() body: CommandDto): Promise<CommandResultDto> {
    const sshConfig = this.loadSshConfig();
    return this.remoteFileService.runCommand(sshConfig, body.command);
  }
  /**
   * Loads SSH configuration from environment variables.
   * Throws an exception if private key is missing.
   */
  private loadSshConfig() {
    const privateKeyPath = this.configService.get<string>(
      'SSH_PRIVATE_KEY_PATH',
    );

    if (!privateKeyPath || !existsSync(privateKeyPath)) {
      throw new InternalServerErrorException(
        `Private key file not found at path: ${privateKeyPath}`,
      );
    }

    return {
      host: this.configService.get<string>('SSH_HOST'),
      port: this.configService.get<number>('SSH_PORT', 22),
      username: this.configService.get<string>('SSH_USERNAME'),
      privateKey: readFileSync(privateKeyPath),
      passphrase: this.configService.get<string>('SSH_PASSPHRASE') || undefined,
    };
  }

  @Get('download')
  @ApiOperation({ summary: 'Download a remote file' })
  @ApiQuery({
    name: 'remotePath',
    type: String,
    description: 'Full remote file path to download',
    example: '/var/www/index.html',
  })
  @ApiResponse({ status: 200, description: 'Returns the downloaded file' })
  @ApiResponse({ status: 404, description: 'File not found on remote server' })
  @ApiResponse({ status: 500, description: 'SSH or file operation failed' })
  async downloadFile(
    @Query('remotePath') remotePath: string,
    @Res() res: Response,
  ): Promise<void> {
    const localTmpPath = join(
      '/tmp',
      `${Date.now()}-${pathModule.basename(remotePath)}`,
    );
    const sshConfig = this.loadSshConfig();

    await this.remoteFileService.downloadFile(
      sshConfig,
      remotePath,
      localTmpPath,
    );

    res.download(localTmpPath, pathModule.basename(remotePath), (err) => {
      // Cleanup after sending
      try {
        unlinkSync(localTmpPath);
      } catch (cleanupErr) {
        this.remoteFileService['logger'].warn(
          `Failed to delete temp file: ${cleanupErr.message}`,
        );
      }
      if (err) {
        throw new InternalServerErrorException('Failed to send file');
      }
    });
  }
}
