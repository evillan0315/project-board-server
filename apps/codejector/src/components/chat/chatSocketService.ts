/**
 * @file Dedicated WebSocket service for chat and video signaling events.
 * @description This service connects to the '/ws' namespace of the NestJS ChatGateway
 * and provides methods for sending/receiving chat messages and WebRTC signaling payloads.
 */

import { io, Socket } from 'socket.io-client';
import { getToken } from '@/stores/authStore';
import { atom } from 'nanostores';
import { SendMessageDto, GetHistoryDto, JoinVideoRoomDto, SignalingPayloadDto, Message } from './types';

// WebSocket URL, using relative path for Vite proxy consistency
const WS_BASE_URL = import.meta.env.VITE_WS_URL || '/api'; 
const CHAT_WS_NAMESPACE = '/chat'; // Matches NestJS ChatGateway path

/**
 * A Nanostore to hold the connection status of the chat WebSocket.
 */
export const isChatSocketConnected = atom(false);

/**
 * Interface for the authenticated socket, extended with userId.
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Helper function to deserialize message timestamps from ISO strings to Date objects.
 */
const deserializeMessage = (rawMessage: any): Message => {
  return {
    ...rawMessage,
    timestamp: new Date(rawMessage.timestamp), // Convert ISO string to Date object
  };
};

class ChatSocketService {
  private socket: AuthenticatedSocket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  /**
   * Connects to the chat WebSocket server.
   * @param token Optional JWT token for authentication. Defaults to token from authStore.
   * @returns A Promise that resolves when connected or rejects on error.
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        console.warn('Chat Socket already connected.');
        resolve();
        return;
      }

      const authToken = token || getToken();
      if (!authToken) {
        console.error('No authentication token available for Chat WebSocket connection.');
        reject(new Error('Authentication token missing.'));
        return;
      }

      this.socket = io(WS_BASE_URL + CHAT_WS_NAMESPACE, {
        transports: ['websocket'],
        auth: {
          token: `Bearer ${authToken}`,
        },
      });
      console.log(authToken, this.socket);
      this.socket.on('connect', () => {
        console.log('Chat WebSocket connected:', this.socket?.id);
        isChatSocketConnected.set(true);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Chat WebSocket disconnected:', reason);
        isChatSocketConnected.set(false);
      });

      this.socket.on('connect_error', (err) => {
        console.error('Chat WebSocket connection error:', err.message);
        isChatSocketConnected.set(false);
        reject(err);
      });

      this.socket.on('auth_error', (data: { message: string }) => {
        console.error('Chat WebSocket authentication error:', data.message);
        reject(new Error(`Authentication error: ${data.message}`));
        this.disconnect(); // Force disconnect on auth error
      });

      // Re-register all stored listeners after connection
      this.listeners.forEach((callback, event) => {
        if (this.socket) {
          this.socket.on(event, callback);
        }
      });
    });
  }

  /**
   * Disconnects from the chat WebSocket server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      isChatSocketConnected.set(false);
      console.log('Chat WebSocket disconnected successfully.');
    }
  }

  /**
   * Emits an event to the chat WebSocket server.
   * @param event The event name to emit.
   * @param data The payload for the event.
   */
  public emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit '${event}': Chat WebSocket not connected.`);
      // Optionally, queue events or inform the user
    }
  }

  /**
   * Registers a listener for a specific WebSocket event.
   * @param event The event name to listen for.
   * @param callback The callback function to execute when the event is received.
   */
  public on<T>(event: string, callback: (data: T) => void): void {
    // Wrap the callback for message-related events to deserialize timestamps
    const wrappedCallback = (data: any) => {
      if (event === 'receive_message') {
        callback(deserializeMessage(data) as T);
      } else if (event === 'conversation_history') {
        callback((data as any[]).map(deserializeMessage) as T);
      } else {
        callback(data as T);
      }
    };

    this.listeners.set(event, wrappedCallback); // Store wrapped listener
    if (this.socket) {
      this.socket.on(event, wrappedCallback);
    }
  }

  /**
   * Removes a listener for a specific WebSocket event.
   * @param event The event name to remove the listener from.
   */
  public off(event: string): void {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Sends a chat message.
   */
  public sendMessage(data: SendMessageDto): void {
    this.emit('send_message', data);
  }

  /**
   * Requests conversation history.
   */
  public getHistory(data: GetHistoryDto): void {
    this.emit('get_history', data);
  }

  /**
   * Joins a video room.
   */
  public joinVideoRoom(data: JoinVideoRoomDto): void {
    this.emit('join_video_room', data);
  }

  /**
   * Sends a WebRTC offer.
   */
  public sendOffer(data: SignalingPayloadDto): void {
    this.emit('send_offer', data);
  }

  /**
   * Sends a WebRTC answer.
   */
  public sendAnswer(data: SignalingPayloadDto): void {
    this.emit('send_answer', data);
  }

  /**
   * Sends a WebRTC ICE candidate.
   */
  public sendCandidate(data: SignalingPayloadDto): void {
    this.emit('send_candidate', data);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatSocketService = new ChatSocketService();
