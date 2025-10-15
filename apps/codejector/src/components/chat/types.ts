/**
 * @file Defines shared types and interfaces for the chat components.
 */

import { Socket } from 'socket.io-client';
import React from 'react';

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

// =========================================================================
// Video Chat Types
// =========================================================================

export interface PeerInfo {
  socketId: string;
  userId?: string;
}

export interface PeerConnectionState {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  remoteAudioTrack: MediaStreamTrack | null;
  remoteVideoTrack: MediaStreamTrack | null;
}

export interface MediaStreamState {
  localStream: MediaStream | null;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
}

export interface RemoteVideoFeed {
  peerId: string;
  stream: MediaStream;
}

export interface VideoFeedProps {
  stream: MediaStream | null;
  muted?: boolean;
  peerId?: string;
  isLocal?: boolean;
}

export interface VideoControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
}

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

export interface VideoChatComponentProps {
  roomId: string;
  onClose?: () => void;
}
