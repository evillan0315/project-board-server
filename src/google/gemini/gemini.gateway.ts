import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  namespace: '/gemini',
  cors: { origin: '*' },
})
export class GeminiGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GeminiGateway.name);

  afterInit(server: Server) {
    this.logger.log('Gemini WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('gemini.new_data')
  handleGeminiNewData(payload: any) {
    this.logger.debug(`Broadcasting Gemini data: ${JSON.stringify(payload)}`);
    this.server.emit('gemini', payload);
  }
}
