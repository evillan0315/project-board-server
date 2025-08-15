import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AudioService } from './audio.service';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/audio',
})
export class AudioGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(AudioGateway.name);
  constructor(private readonly audioService: AudioService) {}
  afterInit(server: Server) {
    this.logger.log('AudioGateway WebSocket Gateway initialized');
  }
  handleConnection(client: Socket) {
    console.log(`Client connected to media downloader: ${client.id}`);
    this.logger.log(`Client connected to media downloader: ${client.id}`);
  }

  @SubscribeMessage('extract_audio')
  async handleExtractAudio(
    @MessageBody()
    data: {
      url: string;
      format?: string;
      provider?: string;
      cookieAccess?: boolean;
    },
  ): Promise<void> {
    const { url, format = 'webm', provider, cookieAccess } = data;

    try {
      const allowedFormats = [
        'mp3',
        'webm',
        'm4a',
        'wav',
        'mp4',
        'flv',
      ] as const;
      type Format = (typeof allowedFormats)[number];

      const isValidFormat = (f: string): f is Format =>
        allowedFormats.includes(f as Format);

      const requestedFormat: Format = isValidFormat(format) ? format : 'webm';

      const filePath = await this.audioService.extractAudioVideoFromYoutube(
        url,
        requestedFormat,
        (info: { percent: number; downloaded?: number; total?: number }) => {
          const { percent, downloaded, total } = info;

          this.server.emit('download_progress', {
            progress: percent,
            downloaded,
            total,
            remaining:
              total && downloaded !== undefined
                ? total - downloaded
                : undefined,
          });
          this.logger.log(
            `Download In Progress: ${percent}% — ${downloaded}/${total} Remaining: ${
              total && downloaded !== undefined ? total - downloaded : undefined
            }`,
          );
        },
        (filePath: string) => {
          this.server.emit('download_ready', { filePath });
          this.logger.log(`Download Ready: ${filePath}`);
        },
        provider,
        cookieAccess,
      );

      this.server.emit('download_complete', { filePath });
    } catch (error) {
      this.server.emit('download_error', { message: error.message });
    }
  }
} // <- This closing brace was missing
