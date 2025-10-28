/**
 * @file Dedicated WebSocket service for WebRTC signaling events.
 * @description This service connects to a dedicated namespace (e.g., '/webrtc-signaling')
 * and provides methods for sending/receiving WebRTC signaling payloads.
 */

import { io, Socket } from 'socket.io-client';
import { getToken } from '@/stores/authStore';
import { atom } from 'nanostores';
import { JoinVideoRoomDto, SignalingPayloadDto, PeerInfo } from './types';

// WebSocket URL base from environment variables
const WS_BASE_URL = import.meta.env.VITE_WS_URL as string; // e.g., 'ws://localhost:3000'
const WEBRTC_WS_NAMESPACE = '/chat'; // Matches NestJS ChatGateway namespace for video signaling

/**
 * A Nanostore to hold the connection status of the WebRTC signaling WebSocket.
 */
export const isWebRtcSignalingSocketConnected = atom(false);

class WebRtcSignalingSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  /**
   * Connects to the WebRTC signaling WebSocket server.
   * @param token Optional JWT token for authentication. Defaults to token from authStore.
   * @returns A Promise that resolves when connected or rejects on error.
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        console.warn('WebRTC Signaling Socket already connected.');
        resolve();
        return;
      }

      const authToken = token || getToken();
      if (!authToken) {
        console.error('No authentication token available for WebRTC Signaling WebSocket connection.');
        reject(new Error('Authentication token missing.'));
        return;
      }

      if (!WS_BASE_URL) {
        console.error('VITE_WS_URL is not defined. Cannot connect to WebRTC Signaling WebSocket.');
        reject(new Error('WebSocket base URL missing.'));
        return;
      }

      this.socket = io(WS_BASE_URL + WEBRTC_WS_NAMESPACE, {
        transports: ['websocket'],
        auth: {
          token: `Bearer ${authToken}`,
        },
      });

      this.socket.on('connect', () => {
        console.log('WebRTC Signaling WebSocket connected:', this.socket?.id);
        isWebRtcSignalingSocketConnected.set(true);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebRTC Signaling WebSocket disconnected:', reason);
        isWebRtcSignalingSocketConnected.set(false);
      });

      this.socket.on('connect_error', (err) => {
        console.error('WebRTC Signaling WebSocket connection error:', err.message);
        isWebRtcSignalingSocketConnected.set(false);
        reject(err);
      });

      this.socket.on('auth_error', (data: { message: string }) => {
        console.error('WebRTC Signaling WebSocket authentication error:', data.message);
        reject(new Error(`Authentication error: ${data.message}`));
        this.disconnect();
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
   * Disconnects from the WebRTC signaling WebSocket server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      isWebRtcSignalingSocketConnected.set(false);
      console.log('WebRTC Signaling WebSocket disconnected successfully.');
    }
  }

  /**
   * Emits an event to the WebRTC signaling WebSocket server.
   * @param event The event name to emit.
   * @param data The payload for the event.
   */
  public emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit '${event}': WebRTC Signaling WebSocket not connected.`);
    }
  }

  /**
   * Registers a listener for a specific WebSocket event.
   * @param event The event name to listen for.
   * @param callback The callback function to execute when the event is received.
   */
  public on<T>(event: string, callback: (data: T) => void): void {
    const wrappedCallback = (data: any) => callback(data as T); // No special deserialization for signaling data
    this.listeners.set(event, wrappedCallback);
    if (this.socket) {
      this.socket.on(event, wrappedCallback);
    }
  }

  /**
   * Removes a listener for a specific WebSocket event.
   * @param event The event name to remove the listener from.
   */
  public off(event: string): void {
    const callback = this.listeners.get(event);
    if (this.socket && callback) {
      this.socket.off(event, callback);
    }
    this.listeners.delete(event);
  }

  /**
   * Joins a video room (signaling).
   */
  public joinRoom(data: JoinVideoRoomDto): void {
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
   */  public sendCandidate(data: SignalingPayloadDto): void {
    this.emit('send_candidate', data);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webRtcSignalingSocketService = new WebRtcSignalingSocketService();
