// file.gateway.ts
import {
  Logger,
  UseGuards,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
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
import {
  readFileSync,
  existsSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
} from 'fs';
import { resolve, dirname } from 'path';

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
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private token: string;
  private readonly logger = new Logger(FileGateway.name);
  private server: Server;
  private fileEditorsMap: Map<string, Set<string>> = new Map();
  constructor(
    @Inject('EXCLUDED_FOLDERS') private readonly EXCLUDED_FOLDERS: string[],
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('FileGateway initialized');
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
      const socketToken = client.handshake.auth?.token
        ?.replace('Bearer ', '')
        .trim();
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
  private async handleApi(
    endpoint: string,
    method: Method,
    body?: any,
  ): Promise<any> {
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
    headers?: any
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
  /*@SubscribeMessage('dynamicFileEvent')
  async handleDynamicFileEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ApiDataProps,
  ): Promise<WsResponse<any>> {
    try {
      this.logger.log(`Dynamic request: ${JSON.stringify(data)}`);
      const responseEvent = `${data.event}Response`;
      const res = await this.handleApi(data.endpoint, data.method, data.body);
      //const res = await this.handleApi(client, data.event, data.endpoint, data.method, data.body);

      const responseData = res?.data;

      return { event: responseEvent, data: responseData };
    } catch (error) {
      this.logger.error(
        `Error in dynamicFileEvent: ${error.message}`,
        error.stack,
      );
      const errorEvent = `${data.event}Error`;
      client.emit(errorEvent, { message: error.message });
      return { event: errorEvent, data: error.message };
    }
  }*/
  @SubscribeMessage('dynamicFileEvent')
  async handleDynamicFileEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ApiDataProps,
  ): Promise<WsResponse<any>> {
    try {
      //this.logger.log(`Dynamic request: ${JSON.stringify(data)}`);
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
      if(data.event === 'readFile' || data.event === 'writeFile' || data.event === 'closeFile'){
        this.server.emit( responseEvent, res?.data );
      }
      
      return { event: responseEvent, data: res?.data };
    } catch (error) {
      const errorEvent = `${data.event}Error`;
      this.logger.error(
        `Error in dynamicFileEvent: ${error.message}`,
        error.stack,
      );
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

    // Register editor
    const socketId = client.id;
    if (!this.fileEditorsMap.has(filePath)) {
      this.fileEditorsMap.set(filePath, new Set());
    }
    this.fileEditorsMap.get(filePath)!.add(socketId);

    const content = readFileSync(filePath, 'utf-8');
    client.emit('openFileResponse', { path: data.path, content });
    this.logger.log(`File opened: ${data.path}`);
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
    const socketId = client.id;
    const editors = this.fileEditorsMap.get(filePath);
    if (editors) {
      editors.delete(socketId);
      if (editors.size === 0) {
        this.fileEditorsMap.delete(filePath);
      }
    }

    client.emit('closeFileResponse', { path: data.path });
    this.logger.log(`File closed: ${data.path}`);
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
    this.logger.log(`File written: ${data.filePath}`);

    client.emit('updateFileResponse', { path: data.filePath, success: true });

    // Notify other editors
    const socketId = client.id;
    const editors = this.fileEditorsMap.get(fullPath) ?? new Set();
    for (const editorId of editors) {
      if (editorId !== socketId) {
        const targetClient = this.getClientById(editorId);
        if (targetClient) {
          targetClient.emit('fileUpdated', {
            path: data.filePath,
            message: 'File was modified by another user',
          });
        }
      }
    }
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
      this.logger.log(`File created: ${data.filePath}`);
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
      this.logger.log(`File deleted: ${data.filePath}`);
      client.emit('deleteFileResponse', { path: data.filePath, success: true });
    } catch (err: any) {
      this.logger.error(`deleteFile error: ${err.message}`);
      client.emit('deleteFileError', { message: err.message });
    }
  }
}
