import { Logger, UseGuards, Inject, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsResponse,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import * as chokidar from 'chokidar';

import axios, { AxiosInstance, Method } from 'axios';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

interface ApiDataProps {
  endpoint: string;
  method: Method;
  body?: any;
  event: string;
  params?: string;
  responseType?: string;
  headers?: string;
}

const api: AxiosInstance = axios.create({
  baseURL: `${process.env.BASE_URL}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/files',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class FileGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private token: string;
  private readonly logger = new Logger(FileGateway.name);
  private server: Server;
  private fileEditorsMap: Map<string, Set<string>> = new Map(); // file path -> set of socket IDs
  private fileWatcher: chokidar.FSWatcher;
  private readonly projectRoot: string;
  private readonly ignoredPaths: string[];
  private readonly additionalIgnoredFolders: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.vscode',
    '.idea',
    'logs',
    'uploads',
    'downloads',
    'apps',
    'libs',
    'frontend',
    'ai-editor',
    'code-editor',
    'project-board-front',
    'codegen-live',
    'gemini-live',
    'json-fix-validator',
    'nestjs-frontend',
    'point-of-sale',
    'resume-app',
    'starter-app',
  ];

  constructor(
    @Inject('EXCLUDED_FOLDERS') private readonly systemExcludedFolders: string[],
    private readonly configService: ConfigService,
  ) {
    this.projectRoot = this.configService.get<string>('PROJECT_ROOT') || process.cwd();

    this.ignoredPaths = [
      // Map system excluded folders relative to project root
      ...this.systemExcludedFolders.map((folder) => resolve(this.projectRoot, folder)),
      // Map additional development-related folders relative to project root
      ...this.additionalIgnoredFolders.map((folder) => resolve(this.projectRoot, folder)),
    ];

    this.logger.log(`FileGateway will watch project root: ${this.projectRoot}`);
    this.logger.debug(`Ignored paths (absolute): ${this.ignoredPaths.join(', ')}`);
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('FileGateway initialized');
    this.initializeFileWatcher();
  }

  onModuleDestroy() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.logger.log('Chokidar watcher closed on module destroy.');
    }
  }

  getClientById(socketId: string): Socket | undefined {
    if (!this.server) {
      this.logger.warn('Server not initialized, cannot get client');
      return undefined;
    }
    return this.server.sockets.sockets.get(socketId);
  }

  async handleConnection(client: Socket) {
    try {
      const socketToken = client.handshake.auth?.token?.replace('Bearer ', '').trim();
      if (!socketToken) {
        client.disconnect();
        throw new UnauthorizedException('Missing or malformed token');
      }
      this.token = socketToken;
      this.logger.log(`Client connected: ${client.id}`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      client.emit('error', `Unauthorized: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const [filePath, editors] of this.fileEditorsMap.entries()) {
      editors.delete(client.id);
      if (editors.size === 0) {
        this.fileEditorsMap.delete(filePath);
      }
    }
  }

  private initializeFileWatcher() {
    this.logger.log(`Initializing Chokidar watcher for ${this.projectRoot}`);
    this.fileWatcher = chokidar.watch(this.projectRoot, {
      ignored: this.ignoredPaths,
      ignoreInitial: true, // Don't emit 'add' events on startup
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 500, // Wait 500ms for file to stabilize after write
        pollInterval: 100,
      },
      depth: 99, // Recursively watch up to 99 levels deep
    });

    this.fileWatcher
      .on('add', (filePath) => this.handleWatcherEvent(filePath, 'created'))
      .on('change', (filePath) => this.handleWatcherEvent(filePath, 'changed'))
      .on('unlink', (filePath) => this.handleWatcherEvent(filePath, 'deleted'))
      .on('addDir', (dirPath) => this.handleWatcherEvent(dirPath, 'dirCreated'))
      .on('unlinkDir', (dirPath) => this.handleWatcherEvent(dirPath, 'dirDeleted'))
      .on('error', (error) =>
        this.logger.error(`Chokidar watcher error: ${error.message}`, error.stack),
      );

    this.fileWatcher.on('ready', () => {
      this.logger.log(`Chokidar watching started for ${this.projectRoot}`);
    });
  }

  private handleWatcherEvent(
    changedPath: string,
    eventType: 'created' | 'changed' | 'deleted' | 'dirCreated' | 'dirDeleted',
  ) {
    this.logger.debug(`File system event detected: ${eventType} - ${changedPath}`);

    // Notify clients who are actively editing this specific file
    const interestedEditors = this.fileEditorsMap.get(changedPath);
    if (interestedEditors) {
      interestedEditors.forEach((socketId) => {
        const clientSocket = this.getClientById(socketId);
        if (clientSocket) {
          clientSocket.emit('fileSystemChange', {
            path: changedPath,
            eventType: eventType,
            message: `File ${changedPath} was ${eventType}.`,
          });
        }
      });
      // If a file is deleted, it's no longer being edited by anyone in this session
      if (eventType === 'deleted') {
        this.fileEditorsMap.delete(changedPath);
      }
    }

    // Broadcast a general file system change event to all connected clients.
    // This allows UI components like file explorers to refresh or update their view.
    this.server.emit('fileSystemChange', {
      path: changedPath,
      eventType: eventType,
      message: `File system change: ${eventType} on ${changedPath}`,
    });
  }

  private async handleApi(endpoint: string, method: Method, body?: any): Promise<any> {
    return api.request({
      url: endpoint,
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      data: body,
    });
  }
  private async handleApiWithProgress(
    client: Socket,
    event: string,
    endpoint: string,
    method: Method,
    body?: any,
    params?: any,
    responseType?: string,
    headers?: any,
  ): Promise<any> {
    return api.request({
      url: endpoint,
      method,
      data: body,
      params: params,
      responseType: responseType as any,
      headers: {
        ...headers,
        Authorization: `Bearer ${this.token}`,
      },
      onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        if (total) {
          const percent = Math.round((loaded * 100) / total);
          this.server.emit(`${event}Progress`, {
            loaded,
            total,
            percent,
            type: 'download',
          });
          this.logger.log(`${event}Progress: ${percent}% downloaded`);
        }
      },
      onUploadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        if (total) {
          const percent = Math.round((loaded * 100) / total);
          client.emit(`${event}Progress`, {
            loaded,
            total,
            percent,
            type: 'upload',
          });
          this.logger.log(`${event}Progress: ${percent}% uploaded`);
        }
      },
    });
  }

  @SubscribeMessage('dynamicFileEvent')
  async handleDynamicFileEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ApiDataProps,
  ): Promise<WsResponse<any>> {
    try {
      const responseEvent = `${data.event}Response`;

      const res = await this.handleApiWithProgress(
        client,
        data.event,
        data.endpoint,
        data.method,
        data.body,
        data.params,
        data.responseType,
      );
      // This block handles API responses that are then broadcasted
      // It's separate from the file watcher, focusing on the result of the API call.
      if (data.event === 'readFile' || data.event === 'writeFile' || data.event === 'closeFile') {
        // this.server.emit(responseEvent, res?.data); // Keeping this for direct API response broadcast if needed, but watcher is now primary for file changes.
      }

      return { event: responseEvent, data: res?.data };
    } catch (error) {
      const errorEvent = `${data.event}Error`;
      this.logger.error(`Error in dynamicFileEvent: ${error.message}`, error.stack);
      client.emit(errorEvent, { message: error.message });
      return { event: errorEvent, data: error.message };
    }
  }

  @SubscribeMessage('openFile')
  async handleOpenFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { path: string },
  ): Promise<void> {
    try {
      if (!data?.path) throw new Error('Path is required');

      const filePath = resolve(data.path);
      if (!existsSync(filePath)) throw new Error(`File not found: ${data.path}`);

      // Register client as an active editor for this file
      if (!this.fileEditorsMap.has(filePath)) {
        this.fileEditorsMap.set(filePath, new Set());
      }
      this.fileEditorsMap.get(filePath)!.add(client.id);

      const content = readFileSync(filePath, 'utf-8');
      client.emit('openFileResponse', { path: data.path, content });
      this.logger.log(`File opened: ${data.path} by client ${client.id}`);
    } catch (err: any) {
      this.logger.error(`openFile error: ${err.message}`);
      client.emit('openFileError', { message: err.message });
    }
  }

  @SubscribeMessage('closeFile')
  async handleCloseFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { path: string },
  ): Promise<void> {
    try {
      if (!data?.path) throw new Error('Path is required');

      const filePath = resolve(data.path);
      const editors = this.fileEditorsMap.get(filePath);
      if (editors) {
        editors.delete(client.id);
        if (editors.size === 0) {
          this.fileEditorsMap.delete(filePath);
        }
      }

      client.emit('closeFileResponse', { path: data.path });
      this.logger.log(`File closed: ${data.path} by client ${client.id}`);
    } catch (err: any) {
      this.logger.error(`closeFile error: ${err.message}`);
      client.emit('closeFileError', { message: err.message });
    }
  }

  @SubscribeMessage('updateFile')
  async handleUpdateFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { filePath: string; content: string },
  ): Promise<void> {
    try {
      if (!data?.filePath || data.content === undefined) {
        throw new Error('File path and content are required');
      }

      const fullPath = resolve(data.filePath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, data.content, 'utf-8');
      this.logger.log(`File written: ${data.filePath} by client ${client.id}`);

      // Emit a success response to the client who initiated the update.
      // Other clients will be notified via the chokidar watcher's 'changed' event.
      client.emit('updateFileResponse', { path: data.filePath, success: true });
    } catch (err: any) {
      this.logger.error(`updateFile error: ${err.message}`);
      client.emit('updateFileError', { message: err.message });
    }
  }

  @SubscribeMessage('createFile')
  async handleCreateFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { filePath: string; content?: string },
  ): Promise<void> {
    try {
      if (!data?.filePath) {
        throw new Error('File path is required');
      }

      const fullPath = resolve(data.filePath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const content = data.content || '';
      writeFileSync(fullPath, content, 'utf-8');
      this.logger.log(`File created: ${data.filePath} by client ${client.id}`);
      // Other clients will be notified via the chokidar watcher's 'created' event.
      client.emit('createFileResponse', { path: data.filePath, success: true });
    } catch (err: any) {
      this.logger.error(`createFile error: ${err.message}`);
      client.emit('createFileError', { message: err.message });
    }
  }

  @SubscribeMessage('deleteFile')
  async handleDeleteFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { filePath: string },
  ): Promise<void> {
    try {
      if (!data?.filePath) {
        throw new Error('File path is required');
      }

      const fullPath = resolve(data.filePath);
      if (!existsSync(fullPath)) {
        throw new Error(`File not found: ${data.filePath}`);
      }

      unlinkSync(fullPath);
      this.logger.log(`File deleted: ${data.filePath} by client ${client.id}`);
      // Other clients will be notified via the chokidar watcher's 'deleted' event.
      client.emit('deleteFileResponse', { path: data.filePath, success: true });
    } catch (err: any) {
      this.logger.error(`deleteFile error: ${err.message}`);
      client.emit('deleteFileError', { message: err.message });
    }
  }
}
