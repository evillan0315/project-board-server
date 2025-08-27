import { Logger, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { WsUser } from '../shared/decorators/ws-user.decorator';
import { User } from '../types/user';
import { GeminiService } from './gemini.service';
import {
  LiveAudioInputDto,
  LiveEndSessionDto,
  LiveSessionResponseDto,
  LiveTextInputDto,
  LiveTurnResultDto,
  ProcessTurnDto,
  StartLiveSessionDto,
} from './dto/gemini-live.dto';
import { WsException } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/gemini', cors: { origin: '*' } }) // CORS handled by app.enableCors() in main.ts
export class GeminiGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GeminiGateway.name);

  constructor(private readonly geminiService: GeminiService) {}

  afterInit(server: Server) {
    this.logger.log('Gemini WebSocket Gateway initialized.');
  }

  handleConnection(@ConnectedSocket() client: Socket, @WsUser() user: User) {
    this.logger.log(`Client connected: ${client.id}, User ID: ${user.id}`);
    // Attach user to client handshake for subsequent requests if needed by other guards/interceptors
    client.handshake.user = user;
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optionally, find and end any sessions associated with this client if not explicitly ended
    // This might be complex if one user can have multiple sessions or if sessions are meant to persist briefly
  }

  /**
   * Handles the 'startLiveSession' event from the client.
   * Creates a new Gemini session and returns the sessionId.
   */
  @SubscribeMessage('startLiveSession')
  async handleStartLiveSession(
    @MessageBody() data: StartLiveSessionDto,
    @ConnectedSocket() client: Socket,
    @WsUser() user: User,
  ): Promise<WsResponse<LiveSessionResponseDto>> {
    this.logger.log(`User ${user.id} requested to start a live session.`);
    try {
      const { sessionId } = await this.geminiService.startSession(user, data.options);
      return { event: 'sessionStarted', data: { sessionId } };
    } catch (error) {
      this.logger.error(`Failed to start session for user ${user.id}: ${error.message}`);
      throw new WsException(`Failed to start session: ${error.message}`);
    }
  }

  /**
   * Handles 'textInput' event: buffers text for the current session.
   */
  @SubscribeMessage('textInput')
  handleTextInput(
    @MessageBody() data: LiveTextInputDto,
    @ConnectedSocket() client: Socket,
    @WsUser() user: User,
  ): WsResponse<{ sessionId: string; success: boolean }> {
    const session = this.geminiService.getSession(data.sessionId);
    if (!session || session.userId !== user.id) {
      throw new WsException('Session not found or unauthorized.');
    }
    const success = this.geminiService.addTextInput(data.sessionId, data.text);
    return { event: 'textInputBuffered', data: { sessionId: data.sessionId, success } };
  }

  /**
   * Handles 'audioInput' event: buffers base64 audio chunks for the current session.
   */
  @SubscribeMessage('audioInput')
  handleAudioInput(
    @MessageBody() data: LiveAudioInputDto,
    @ConnectedSocket() client: Socket,
    @WsUser() user: User,
  ): WsResponse<{ sessionId: string; success: boolean }> {
    const session = this.geminiService.getSession(data.sessionId);
    if (!session || session.userId !== user.id) {
      throw new WsException('Session not found or unauthorized.');
    }
    const success = this.geminiService.addAudioInput(
      data.sessionId,
      data.audioChunk,
      data.mimeType,
    );
    return { event: 'audioInputBuffered', data: { sessionId: data.sessionId, success } };
  }

  /**
   * Handles 'processTurn' event: triggers Gemini processing of all buffered inputs.
   * Streams back 'aiResponse' events as results arrive from Gemini.
   */
  @SubscribeMessage('processTurn')
  processTurn(
    @MessageBody() data: ProcessTurnDto,
    @ConnectedSocket() client: Socket,
    @WsUser() user: User,
  ): Observable<WsResponse<LiveTurnResultDto>> {
    const session = this.geminiService.getSession(data.sessionId);
    if (!session || session.userId !== user.id) {
      throw new WsException('Session not found or unauthorized.');
    }

    this.logger.log(`Processing turn for session ${data.sessionId} by user ${user.id}...`);

    return from(this.geminiService.processTurn(data.sessionId)).pipe(
      map((response) => ({
        event: 'aiResponse', // Event name expected by frontend
        data: response,
      })),
    );
  }

  /**
   * Handles 'endLiveSession' event: cleans up the session.
   */
  @SubscribeMessage('endLiveSession')
  handleEndLiveSession(
    @MessageBody() data: LiveEndSessionDto,
    @ConnectedSocket() client: Socket,
    @WsUser() user: User,
  ): WsResponse<LiveEndSessionDto> {
    const session = this.geminiService.getSession(data.sessionId);
    if (!session || session.userId !== user.id) {
      // Even if session is not found or unauthorized, we can still acknowledge the end for client UX
      this.logger.warn(
        `End session request for non-existent or unauthorized session ${data.sessionId} by user ${user.id}`,
      );
      return { event: 'sessionEnded', data: { sessionId: data.sessionId } };
    }
    this.geminiService.endSession(data.sessionId);
    this.logger.log(`Session ${data.sessionId} explicitly ended by user ${user.id}.`);
    return { event: 'sessionEnded', data: { sessionId: data.sessionId } };
  }
}
