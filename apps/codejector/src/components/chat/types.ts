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
 */
export interface Message {
  id: string;
  conversationId?: string;
  userId: string;
  content: string; // Changed from 'text' to 'content' for consistency
  createdAt: Date;
  sender: Sender; // Added sender to Message interface
  createdById?: string;
}

/**
 * Props for the MessageBubble component.
 */
export interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

/**
 * Props for the MessageInput component.
 */
export interface MessageInputProps {
  onSendMessage: (text: string, userId?: string) => void;
}

/**
 * Props for the VideoChatComponent.
 */
export interface VideoChatComponentProps {
  roomId: string;
  onClose?: () => void;
}

/**
 * DTO for sending a chat message to the WebSocket server.
 */
export interface SendMessageDto {
  conversationId: string;
  userId: string;
  content: string;
  sender: Sender;
}

/**
 * DTO for requesting conversation history from the WebSocket server.
 */
export interface GetHistoryDto {
  conversationId: string;
  limit?: number;
  offset?: number;
}

/**
 * DTO for joining a video room via WebSocket signaling.
 */
export interface JoinVideoRoomDto {
  roomId: string;
  userId: string;
}

/**
 * DTO for sending WebRTC signaling payloads (offers, answers, ICE candidates).
 */
export interface SignalingPayloadDto {
  roomId: string;
  targetUserId: string; // The peer who should receive this signaling message
  payload: RTCSessionDescriptionInit | RTCIceCandidate;
  // senderUserId is implicitly handled by the socket.io server from the authenticated user
}

/**
 * Represents the state of a single peer connection managed by the WebRtcStore.
 */
export interface PeerConnectionState {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  remoteAudioTrack: MediaStreamTrack | null;
  remoteVideoTrack: MediaStreamTrack | null;
}

/**
 * Represents a remote video feed to be displayed in the UI.
 */
export interface RemoteVideoFeed {
  peerId: string;
  stream: MediaStream;
}

/**
 * Represents information about a peer, typically received when a user joins a room.
 */
export interface PeerInfo {
  socketId: string;
  userId?: string; // Optional, might be available depending on backend payload
}
