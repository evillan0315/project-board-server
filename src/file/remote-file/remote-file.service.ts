import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Client, ConnectConfig, SFTPWrapper, Stats } from 'ssh2';
import * as pathModule from 'path';
import { Stream } from 'stream';
import { createWriteStream } from 'fs';

interface RemoteFileEntry {
  path: string;
  size: number;
  modifiedTime: Date | null;
}

interface RemoteDirectoryEntry {
  path: string;
}

interface RemoteFileListResult {
  files: RemoteFileEntry[];
  directories: RemoteDirectoryEntry[];
}

@Injectable()
export class RemoteFileService {
  private readonly logger = new Logger(RemoteFileService.name);

  private connectSftp(
    config: ConnectConfig,
  ): Promise<{ client: Client; sftp: SFTPWrapper }> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      client
        .on('ready', () => {
          client.sftp((err, sftp) => {
            if (err) {
              client.end();
              this.logger.error(`SFTP error: ${err.message}`);
              return reject(
                new InternalServerErrorException('SFTP session failed'),
              );
            }
            resolve({ client, sftp });
          });
        })
        .on('error', (err) => {
          this.logger.error(`SSH connection error: ${err.message}`);
          reject(new InternalServerErrorException('SSH connection failed'));
        })
        .connect(config);
    });
  }
  async downloadFile(
    config: ConnectConfig,
    remotePath: string,
    localPath: string,
  ): Promise<void> {
    const { client, sftp } = await this.connectSftp(config);

    return new Promise((resolve, reject) => {
      const stream: Stream = sftp.createReadStream(remotePath);
      const writeStream = createWriteStream(localPath);

      stream
        .on('error', (err) => {
          client.end();
          this.logger.error(`SFTP read error: ${err.message}`);
          reject(
            new InternalServerErrorException(`Failed to read remote file`),
          );
        })
        .pipe(writeStream)
        .on('finish', () => {
          client.end();
          this.logger.log(`Downloaded ${remotePath} to ${localPath}`);
          resolve();
        })
        .on('error', (err) => {
          client.end();
          this.logger.error(`Write stream error: ${err.message}`);
          reject(
            new InternalServerErrorException(`Failed to write local file`),
          );
        });
    });
  }
  async createOrUpdateFile(
    config: ConnectConfig,
    remotePath: string,
    content: string,
    requireExistence = false,
  ): Promise<void> {
    const { client, sftp } = await this.connectSftp(config);

    try {
      if (requireExistence) {
        const exists = await this.fileExists(sftp, remotePath);
        if (!exists) {
          throw new NotFoundException(`File does not exist: ${remotePath}`);
        }
      }

      await this.writeFileAsync(sftp, remotePath, content);
      this.logger.log(`File written: ${remotePath}`);
    } finally {
      client.end();
    }
  }

  async deleteFile(config: ConnectConfig, remotePath: string): Promise<void> {
    const { client, sftp } = await this.connectSftp(config);

    try {
      const exists = await this.fileExists(sftp, remotePath);
      if (!exists) {
        throw new NotFoundException(`File does not exist: ${remotePath}`);
      }

      await this.deleteFileAsync(sftp, remotePath);
      this.logger.log(`File deleted: ${remotePath}`);
    } finally {
      client.end();
    }
  }

  private async fileExists(
    sftp: SFTPWrapper,
    remotePath: string,
  ): Promise<boolean> {
    try {
      await this.statAsync(sftp, remotePath);
      return true;
    } catch {
      return false;
    }
  }

  private writeFileAsync(
    sftp: SFTPWrapper,
    remotePath: string,
    content: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      sftp.writeFile(remotePath, Buffer.from(content), (err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(`Write failed: ${err.message}`),
          );
        }
        resolve();
      });
    });
  }

  private deleteFileAsync(
    sftp: SFTPWrapper,
    remotePath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      sftp.unlink(remotePath, (err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(`Delete failed: ${err.message}`),
          );
        }
        resolve();
      });
    });
  }
  private connectSsh(config: ConnectConfig): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      client
        .on('ready', () => {
          this.logger.log(`SSH connection ready: ${config.host}`);
          resolve(client);
        })
        .on('error', (err) => {
          this.logger.error(`SSH connection error: ${err.message}`);
          reject(new InternalServerErrorException('SSH connection failed'));
        })
        .connect(config);
    });
  }
  async runCommand(
    config: ConnectConfig,
    command: string,
  ): Promise<{ stdout: string; stderr: string }> {
    const client = await this.connectSsh(config);

    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) {
          client.end();
          return reject(
            new InternalServerErrorException(
              `Failed to execute command: ${err.message}`,
            ),
          );
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number, signal: string) => {
            this.logger.log(`Command executed: code=${code}, signal=${signal}`);
            client.end();
            resolve({ stdout, stderr });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }
  async listFilesAndDirectories(
    config: ConnectConfig,
    remotePath: string,
    options?: { maxDepth?: number; maxFiles?: number },
  ): Promise<RemoteFileListResult> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      client
        .on('ready', () => {
          this.logger.log(`SSH connection established to ${config.host}`);

          client.sftp((err, sftp) => {
            if (err) {
              client.end();
              this.logger.error(`SFTP error: ${err.message}`);
              return reject(
                new InternalServerErrorException('SFTP session failed'),
              );
            }

            this.readDirectoryRecursive(
              sftp,
              remotePath,
              '',
              options?.maxDepth ?? Infinity,
              options?.maxFiles ?? Infinity,
            )
              .then((result) => {
                client.end();
                resolve(result);
              })
              .catch((err) => {
                client.end();
                this.logger.error(`Read directory error: ${err.message}`);
                reject(
                  new InternalServerErrorException(
                    'Failed to read remote directory',
                  ),
                );
              });
          });
        })
        .on('error', (err) => {
          this.logger.error(`SSH connection error: ${err.message}`);
          reject(new InternalServerErrorException('SSH connection failed'));
        })
        .connect(config);
    });
  }

  private async readDirectoryRecursive(
    sftp: SFTPWrapper,
    dirPath: string,
    basePath: string,
    maxDepth: number,
    maxFiles: number,
    currentDepth = 0,
    fileCounter = { count: 0 },
  ): Promise<RemoteFileListResult> {
    const files: RemoteFileEntry[] = [];
    const directories: RemoteDirectoryEntry[] = [];

    if (currentDepth > maxDepth) {
      return { files, directories };
    }

    const list = await this.readdirAsync(sftp, dirPath);

    for (const item of list) {
      const fullPath = pathModule.posix.join(dirPath, item.filename);
      const relativePath = pathModule.posix.join(basePath, item.filename);

      if (item.longname.startsWith('d')) {
        directories.push({ path: relativePath });

        const childResult = await this.readDirectoryRecursive(
          sftp,
          fullPath,
          relativePath,
          maxDepth,
          maxFiles,
          currentDepth + 1,
          fileCounter,
        );

        files.push(...childResult.files);
        directories.push(...childResult.directories);
      } else {
        if (fileCounter.count >= maxFiles) {
          this.logger.warn(
            `File limit of ${maxFiles} reached. Stopping recursion.`,
          );
          break;
        }

        const stats = await this.statAsync(sftp, fullPath);

        files.push({
          path: relativePath,
          size: stats.size,
          modifiedTime: stats.mtime ? new Date(stats.mtime * 1000) : null,
        });

        fileCounter.count++;
      }

      if (fileCounter.count >= maxFiles) {
        break;
      }
    }

    return { files, directories };
  }

  private readdirAsync(sftp: SFTPWrapper, path: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      sftp.readdir(path, (err, list) => {
        if (err) {
          return reject(err);
        }
        resolve(list);
      });
    });
  }

  private statAsync(sftp: SFTPWrapper, path: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
      sftp.stat(path, (err, stats) => {
        if (err) {
          return reject(err);
        }
        resolve(stats);
      });
    });
  }
}
