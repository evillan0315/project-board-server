/**
 * @file Defines shared types and interfaces for the chat components.
 */

/**
 * Represents a single message in the chat.
 */
export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
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
  userId: string; // Changed from senderId to userId to match backend DTO
  content: string;
  sender: 'USER' | 'BOT' | 'AI'; // Made non-optional to match backend DTO
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
 * Represents the state of a single peer connection managed by useWebRTC hook.
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

/**
 * Result type for the useWebRTC custom hook.
 */
export interface UseWebRTCHooksResult {
  localStream: MediaStream | null;
  remoteStreams: RemoteVideoFeed[];
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  error: string | null;
  isLoading: boolean;
  connect: (roomId: string, token: string) => Promise<void>;
  disconnect: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
}
