/**
 * @file Defines shared types and interfaces for the chat components.
 */

// Define Sender enum for consistency with backend
export enum Sender {
  USER = 'USER',
  BOT = 'BOT',
  AI = 'AI'
}

/**
 * Represents a single message in the chat.
 * Matches the Prisma `Message` model structure.
 */
export interface Message {
  id: string;
  conversationId: string;
  createdById: string; // Corresponds to the User.id who sent/generated the message
  content: string;
  createdAt: Date;
  sender: Sender;
}

/**
 * Represents a chat conversation.
 * Matches the Prisma `Conversation` model structure.
 */
export interface Conversation {
  id: string;
  title: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

/**
 * Props for the MessageBubble component.
 */
export interface MessageBubbleProps {
  message: Message;
  currentUserId: string; // The authenticated user's database ID
}

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  messages: Message[];
  currentUserId: string; // The authenticated user's database ID
}

/**
 * Props for the MessageInput component.
 */
export interface MessageInputProps {
  onSendMessage: (text: string, createdBy?: string) => void;
}

/**
 * Props for the VideoChatComponent.
 */
export interface VideoChatComponentProps {
  roomId: string; // The ID of the conversation/session/room
  onClose?: () => void;
}

/**
 * DTO for creating a new Conversation via REST (for initial setup).
 * Matches `CreateConversationDto` from backend.
 */
export interface CreateConversationDto {
  title: string;
  createdById: string;
}

/**
 * DTO for retrieving a list of conversations.
 * Matches `GetConversationsDto` from backend.
 */
export interface GetConversationsDto {
  userId: string; // The database ID of the user
  limit?: number;
  offset?: number;
}

/**
 * DTO for sending a chat message to the WebSocket server.
 * Matches `SendMessageDto` from backend, where `userId` maps to Prisma `createdById`.
 */
export interface SendMessageDto {
  conversationId: string;
  userId: string; // The database ID of the user creating the message (will be `createdById` on backend)
  content: string;
  sender: Sender;
}

/**
 * DTO for requesting conversation history from the WebSocket server.
 * Matches `GetHistoryDto` from backend.
 */
export interface GetHistoryDto {
  conversationId: string;
  limit?: number;
  offset?: number;
}

/**
 * DTO for joining a video room via WebSocket signaling.
 * Matches `JoinVideoRoomDto` from backend.
 */
export interface JoinVideoRoomDto {
  roomId: string; // The ID of the conversation/session/room
  userId: string; // The database ID of the user joining the room
}

/**
 * DTO for sending WebRTC signaling payloads (offers, answers, ICE candidates).
 * `targetSocketId` identifies the WebSocket client ID (not database user ID).
 * Matches `SignalingPayloadDto` from backend (where `targetUserId` is actually a socketId).
 */
export interface SignalingPayloadDto {
  roomId: string;
  targetSocketId: string; // The WebSocket client ID of the recipient/target peer
  payload: RTCSessionDescriptionInit | RTCIceCandidate | any;
}

/**
 * Represents the state of a single peer connection managed by the WebRtcStore.
 * `peerId` here refers to the remote peer's `socketId`.
 */
export interface PeerConnectionState {
  peerId: string; // The socket ID of the remote peer
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  remoteAudioTrack: MediaStreamTrack | null;
  remoteVideoTrack: MediaStreamTrack | null;
}

/**
 * Represents a remote video feed to be displayed in the UI.
 */
export interface RemoteVideoFeed {
  peerId: string; // The socket ID of the remote peer
  stream: MediaStream;
}

/**
 * Represents information about a peer, typically received when a user joins a room.
 * Matches `user_joined` and `existing_users_in_room` payloads from backend.
 */
export interface PeerInfo {
  socketId: string;
  userId?: string; // Optional: The database user ID, if available from backend
}