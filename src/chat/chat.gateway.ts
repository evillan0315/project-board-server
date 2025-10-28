import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  GetHistoryDto,
  JoinVideoRoomDto,
  SignalingPayloadDto,
} from './dto/chat.dto';
import { AuthService } from '../auth/auth.service'; // Assuming AuthService path
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// --- Type Definitions ---

// Define a simple structure for the user payload returned by the token validation
// This ensures type safety when accessing properties like 'sub' (the user ID)
interface UserPayload {
  sub: string; // User ID
}

// Define a custom interface for the Socket type to include authenticated properties
interface AugmentedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  // The path is typically only necessary if hosting multiple WebSocket servers on different paths
  // If not using the path property, the client would connect to ws://localhost:3000
  //path: '/ws',
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  private server: Server;
  // A map to track which users are in which rooms for signaling (socketId instead of userId)
  private videoRooms: Map<string, Set<string>> = new Map();

  // Map to store connected clients by userId (Optional, but useful for direct messaging)
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  //@WebSocketServer()

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService, // Dependency injection for authentication
  ) {}
  afterInit(server: Server) {
    this.server = server;
    this.logger.log('Chat Gateway initialized');
  }
  /**
   * Handles client connection and authentication.
   */
  async handleConnection(client: AugmentedSocket) {
    try {
      // 1. Extract and clean the token from the handshake header
      const token = client.handshake.auth?.token?.replace('Bearer ', '').trim();

      if (!token) {
        throw new UnauthorizedException('Missing or malformed token');
      }

      // 2. Validate the token and get the user payload
      // Note: Cast is necessary if AuthService doesn't explicitly return UserPayload
      const user = await this.authService.validateToken(token);
      console.log(user, 'user');
      if (!user || !user.sub) {
        throw new UnauthorizedException('Invalid token or user not found');
      }

      // 3. Attach userId to the socket object
      client.userId = user.sub;

      // 4. Track connection (optional, for direct messaging/status)
      this.connectedUsers.set(user.sub, client.id);

      this.logger.log(
        `Client connected to chat gateway: ${client.id} (User: ${client.userId})`,
      );
    } catch (err) {
      // Handle UnauthorizedException or any other error during validation
      const message =
        err instanceof UnauthorizedException
          ? err.message
          : 'Authentication failed';

      this.logger.warn(
        `Connection rejected for client ${client.id}: ${message}`,
      );

      // Emit an error and disconnect the client
      client.emit('auth_error', { message });
      client.disconnect(true);
    }
  }

  /**
   * Handles client disconnection.
   */
  handleDisconnect(client: AugmentedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up connectedUsers map using the attached userId
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} removed from connected list.`);
    }

    // Clean up videoRooms
    this.videoRooms.forEach((users, roomId) => {
      // Check if the disconnected client was in this room
      if (users.has(client.id)) {
        users.delete(client.id);
        // Notify others in the room that this user has left
        client.to(roomId).emit('user_left', { socketId: client.id });
        this.logger.log(`Client ${client.id} left room ${roomId}`);
      }
    });
  }

  // --- CHAT MESSAGING ---

  /**
   * Listens for incoming chat messages.
   * Saves the message to the database and broadcasts it to the room.
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    // SECURITY CHECK: Ensure user is authenticated
    if (!client.userId) {
      this.logger.warn(
        `Attempted message send by unauthenticated client: ${client.id}`,
      );
      client.emit('error', {
        type: 'AUTH_REQUIRED',
        message: 'You must be authenticated to send messages.',
      });
      return;
    }

    this.logger.log(
      `Message received for conversation ${data.conversationId} from user ${client.userId}`,
    );

    // Save to Database (using the secured client.userId)
    const savedMessage = await this.chatService.saveMessage(
      data.conversationId,
      client.userId, // IMPORTANT: Use authenticated user ID
      data.content,
      data.sender, // Assuming data.sender is just a display name
    );

    // Broadcast to all other clients in the conversation room
    this.server.to(data.conversationId).emit('receive_message', savedMessage);
  }

  /**
   * Fetches the conversation history for a given ID and sends it back to the requester.
   */
  @SubscribeMessage('get_history')
  async handleGetHistory(
    @MessageBody() data: GetHistoryDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', {
        type: 'AUTH_REQUIRED',
        message: 'You must be authenticated to view history.',
      });
      return;
    }

    try {
      this.logger.log(
        `Request for history in conversation: ${data.conversationId} by user ${client.userId}`,
      );

      const history = await this.chatService.getMessagesByConversationId(
        data.conversationId,
      );

      // Client joins the room before receiving history. This ensures they get future messages.
      client.join(data.conversationId);

      // Send history back to the specific client that requested it
      client.emit('conversation_history', history);
      this.logger.log(
        `History sent to client ${client.id} for room ${data.conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching history for user ${client.userId}: ${error.message}`,
      );
      client.emit('error', {
        type: 'HISTORY_ERROR',
        message: 'Could not fetch conversation history.',
      });
    }
  }

  // --- VIDEO SIGNALING (WebRTC) ---

  /**
   * Allows a user to join a video room.
   * Notifies all other users in the room about the new user.
   */
  @SubscribeMessage('join_video_room')
  handleJoinVideoRoom(
    @MessageBody() data: JoinVideoRoomDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', {
        type: 'AUTH_REQUIRED',
        message: 'You must be authenticated to join a video room.',
      });
      return;
    }

    const { roomId } = data;

    // 1. Use the socket ID to manage WebRTC connections easily
    client.join(roomId);

    if (!this.videoRooms.has(roomId)) {
      this.videoRooms.set(roomId, new Set());
    }

    const roomUsers = this.videoRooms.get(roomId);

    // 2. Notify all existing users in the room about the new user
    client
      .to(roomId)
      .emit('user_joined', { socketId: client.id, userId: client.userId });

    // 3. Send the list of existing users (socket IDs) back to the new user
    // Note: In a production app, you'd map socketId back to the userId for existing users.
    const existingUsers = Array.from(roomUsers!).map((socketId) => ({
      socketId,
    }));
    client.emit('existing_users_in_room', existingUsers);

    // 4. Add the new user's socket ID to the room set
    roomUsers!.add(client.id);
    this.logger.log(
      `User ${client.userId} (${client.id}) joined video room ${roomId}`,
    );
  }

  /**
   * Relays a WebRTC Offer (SDP) from one client to another.
   */
  @SubscribeMessage('send_offer')
  handleOffer(
    @MessageBody() data: SignalingPayloadDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    if (!client.userId) return; // Silent return if not authenticated

    this.logger.debug(
      `Relaying OFFER from ${client.id} to ${data.targetUserId} in room ${data.roomId}`,
    );

    // Broadcast the offer to the target user (data.targetUserId is the target socketId)
    client.to(data.targetUserId).emit('receive_offer', {
      senderSocketId: client.id,
      offer: data.payload,
    });
  }

  /**
   * Relays a WebRTC Answer (SDP) from one client to another.
   */
  @SubscribeMessage('send_answer')
  handleAnswer(
    @MessageBody() data: SignalingPayloadDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    if (!client.userId) return; // Silent return if not authenticated

    this.logger.debug(
      `Relaying ANSWER from ${client.id} to ${data.targetUserId} in room ${data.roomId}`,
    );

    // Broadcast the answer to the target user
    client.to(data.targetUserId).emit('receive_answer', {
      senderSocketId: client.id,
      answer: data.payload,
    });
  }

  /**
   * Relays a WebRTC ICE Candidate from one client to another.
   */
  @SubscribeMessage('send_candidate')
  handleCandidate(
    @MessageBody() data: SignalingPayloadDto,
    @ConnectedSocket() client: AugmentedSocket,
  ) {
    if (!client.userId) return; // Silent return if not authenticated

    this.logger.debug(
      `Relaying CANDIDATE from ${client.id} to ${data.targetUserId} in room ${data.roomId}`,
    );

    // Broadcast the ICE candidate to the target user
    client.to(data.targetUserId).emit('receive_candidate', {
      senderSocketId: client.id,
      candidate: data.payload,
    });
  }
}
