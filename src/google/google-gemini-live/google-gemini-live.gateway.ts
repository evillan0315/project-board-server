// src/google/google-gemini-live/google-gemini-live.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { GoogleGeminiLiveService } from './google-gemini-live.service';
import {
  LiveConnectOptionsDto,
  LiveSessionResponseDto,
  LiveTurnResultDto,
  LiveTextInputDto,
  LiveAudioInputDto,
  ProcessTurnDto,
  LiveEndSessionDto,
} from './dto/gemini-live.dto'; // Adjusted import path for DTOs to gemini/dto

@UseGuards(JwtAuthGuard, RolesGuard)
@WebSocketGateway({
  namespace: '/gemini',
  cors: { origin: '*' },
})
export class GoogleGeminiLiveGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GoogleGeminiLiveGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly geminiService: GoogleGeminiLiveService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token?.replace('Bearer ', '').trim();
      if (!token) throw new UnauthorizedException('Missing or malformed token');

      const user = await this.authService.validateToken(token);
      if (!user) throw new UnauthorizedException('Invalid token');

      this.logger.log(`Client connected: ${client.id}, User: ${user.email}`);
      client.emit('connected', { message: 'Connected to Gemini Live gateway' });
    } catch (e: any) {
      this.logger.error(`Connection failed for ${client.id}: ${e.message}`);
      client.emit('unauthorized', { message: e.message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Cleanup of individual sessions is typically triggered by 'endLiveSession'
    // or by an application-level timeout. Disconnect here just means the socket is gone.
  }

  /**
   * Starts a new live session with Gemini.
   * Client should receive a sessionId to use for subsequent interactions.
   * If `initialText` is provided, it's buffered. Client still needs to call `processTurn`
   * to get the AI's first response.
   */
  @SubscribeMessage('startLiveSession')
  async onStartLiveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { options?: LiveConnectOptionsDto },
  ) {
    try {
      const { sessionId } = await this.geminiService.connect(payload.options);
      const response: LiveSessionResponseDto = { sessionId };

      this.logger.log(
        `Live session ${sessionId} started for client ${client.id}`,
      );
      client.emit('sessionStarted', response);
    } catch (e: any) {
      this.logger.error(
        `Failed to start session for client ${client.id}: ${e.message}`,
      );
      client.emit('error', {
        message: `Failed to start session: ${e.message}`,
      });
    }
  }

  /**
   * Buffers a text message for the current turn in a specific session.
   * No AI response is generated until `processTurn` is called.
   */
  @SubscribeMessage('textInput') // Renamed from 'message' for clarity with 'audioInput'
  async onTextInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LiveTextInputDto,
  ) {
    try {
      await this.geminiService.sendText(payload.sessionId, payload.text);
      this.logger.debug(
        `Text buffered for session ${payload.sessionId}: "${payload.text}"`,
      );
      const turn = await this.geminiService.waitTurn(payload.sessionId);
      // Optionally, emit an acknowledgement if needed
      client.emit('textInputBuffered', {
        turn,
        sessionId: payload.sessionId,
        success: true,
      });
    } catch (e: any) {
      this.logger.error(
        `Error buffering text for session ${payload.sessionId}: ${e.message}`,
      );
      client.emit('error', { message: `Failed to send text: ${e.message}` });
    }
  }

  /**
   * Buffers an audio chunk for the current turn in a specific session.
   * Multiple audio chunks can be sent. No AI response is generated until `processTurn` is called.
   */
  @SubscribeMessage('audioInput')
  async onAudioInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LiveAudioInputDto,
  ) {
    try {
      // Decode the base64 audio chunk back to a Uint8Array
      // Note: `atob` is a browser global, but Node.js also has it.
      // For Node.js-only, `Buffer.from(payload.audioChunk, 'base64')` is generally preferred.
      // However, `Uint8Array.from(atob(str), char => char.charCodeAt(0))` is also valid in Node.js >= 16.
      const buffer = Uint8Array.from(atob(payload.audioChunk), (c) =>
        c.charCodeAt(0),
      );

      // sendAudioChunks expects ArrayBuffer[], `buffer` is a Uint8Array.
      // We need to pass the underlying ArrayBuffer of the Uint8Array.
      await this.geminiService.sendAudioChunks(
        payload.sessionId,
        [
          buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          ),
        ],
        payload.mimeType,
      );
      this.logger.debug(
        `Audio chunk buffered for session ${payload.sessionId}. Size: ${buffer.length} bytes.`,
      );
      // Optionally, emit an acknowledgement if needed
      client.emit('audioInputBuffered', {
        sessionId: payload.sessionId,
        success: true,
      });
    } catch (e: any) {
      this.logger.error(
        `Error buffering audio for session ${payload.sessionId}: ${e.message}`,
      );
      client.emit('error', { message: `Failed to buffer audio: ${e.message}` });
    }
  }

  /**
   * Triggers the AI to process all buffered text and audio inputs for the current turn
   * and sends the AI's response back to the client.
   */
  @SubscribeMessage('processTurn')
  async onProcessTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ProcessTurnDto,
  ) {
    try {
      this.logger.log(`Processing turn for session ${payload.sessionId}...`);
      const result: LiveTurnResultDto = await this.geminiService.waitTurn(
        payload.sessionId,
      );
      this.logger.debug(
        `Turn completed for session ${payload.sessionId}. Result: ${JSON.stringify(result)}`,
      );
      // ✅ Emit result back to client
      client.emit('turnComplete', {
        sessionId: payload.sessionId,
        ...result,
      });
      client.emit('aiResponse', result);
      this.logger.log(`AI response sent for session ${payload.sessionId}.`);
    } catch (e: any) {
      this.logger.error(
        `Error processing turn for session ${payload.sessionId}: ${e.message}`,
      );
      client.emit('error', { message: `Failed to process turn: ${e.message}` });
    }
  }

  /**
   * Ends an active live session, clearing its state on the server.
   */
  @SubscribeMessage('endLiveSession')
  async onEndLiveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LiveEndSessionDto,
  ) {
    try {
      await this.geminiService.close(payload.sessionId);

      client.emit('sessionEnded', { sessionId: payload.sessionId });
      this.logger.log(`Session ${payload.sessionId} ended`);
    } catch (e: any) {
      this.logger.error(
        `Failed to close session ${payload.sessionId}: ${e.message}`,
      );
      client.emit('error', {
        message: `Failed to close session: ${e.message}`,
      });
    }
  }
}
