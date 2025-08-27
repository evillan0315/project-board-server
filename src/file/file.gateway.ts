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
      if (
        data.event === 'fileReadFileContent' ||
        data.event === 'fileWriteFileContent' ||
        data.event === 'fileCloseFile'
      ) {
        //this.server.emit(responseEvent, res?.data);
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

  
}

