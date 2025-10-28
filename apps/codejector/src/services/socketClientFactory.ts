import { io, Socket } from 'socket.io-client';
import { getToken } from '@/stores/authStore';

/**
 * Interface for a generic Socket.IO client instance, specific to a namespace.
 */
export interface ISocketClient {
  connect(initialCwd?: string): Promise<void>;
  disconnect(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string): void;
  emit(event: string, data?: any): void;
  isConnected(): boolean;
  socketInstance: Socket | null;
}

/**
 * Factory function to create a new Socket.IO client instance for a specific namespace.
 * Each call to this factory returns an independent client, preventing conflicts
 * when multiple parts of the application require distinct socket connections.
 *
 * @param namespace The Socket.IO namespace (e.g., '/terminal', '/chat').
 * @returns An ISocketClient instance for the given namespace.
 */
export const createSocketClient = (namespace: string): ISocketClient => {
  let socket: Socket | null = null;
  // Listeners are stored to be re-registered on reconnection for robustness.
  const listeners: Map<string, (...args: any[]) => void> = new Map();

  const client: ISocketClient = {
    socketInstance: null,

    /**
     * Establishes a connection to the Socket.IO server for this client's namespace.
     * @param initialCwd Optional: Initial current working directory for the connection query.
     */
    async connect(initialCwd?: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const token = getToken();
        if (!token) {
          return reject(new Error('No authentication token.'));
        }

        // Prevent multiple connections for the same client instance
        if (socket && socket.connected) {
          console.warn(
            `Socket for namespace ${namespace} is already connected.`,
          );
          return resolve();
        }

        socket = io(namespace, {
          auth: {
            token: `Bearer ${token}`,
          },
          query: initialCwd ? { initialCwd } : undefined,
          transports: ['websocket'], // Prefer WebSocket for stability
        });

        client.socketInstance = socket; // Expose the internal socket instance

        socket.on('connect', () => {
          console.log(`Connected to socket server for namespace: ${namespace}`);
          // Re-register all stored listeners upon successful connection
          listeners.forEach((callback, event) => {
            socket?.on(event, callback);
          });
          resolve();
        });

        socket.on('connect_error', (error) => {
          console.error(`Connection error for namespace ${namespace}:`, error);
          reject(error);
        });

        socket.on('disconnect', (reason) => {
          console.log(
            `Disconnected from socket server for namespace ${namespace}: ${reason}`,
          );
          // Clear the socket instance on disconnect
          socket = null;
          client.socketInstance = null;
        });
      });
    },

    /**
     * Disconnects the socket connection for this client.
     */
    disconnect(): void {
      if (socket) {
        socket.disconnect();
        socket = null;
        client.socketInstance = null;
        console.log(
          `Disconnected from socket server for namespace: ${namespace}`,
        );
      }
    },

    /**
     * Registers an event listener for this socket client.
     * Listeners are stored and re-registered on reconnection.
     * @param event The event name to listen for.
     * @param callback The function to call when the event is received.
     */
    on(event: string, callback: (...args: any[]) => void): void {
      listeners.set(event, callback);
      if (socket) {
        socket.on(event, callback);
      }
    },

    /**
     * Unregisters an event listener for this socket client.
     * @param event The event name to remove the listener from.
     */
    off(event: string): void {
      listeners.delete(event);
      if (socket) {
        socket.off(event);
      }
    },

    /**
     * Emits an event with optional data to the server via this socket client.
     * @param event The event name to emit.
     * @param data Optional data to send with the event.
     */
    emit(event: string, data?: any): void {
      if (socket && socket.connected) {
        socket.emit(event, data);
      } else {
        console.warn(
          `Attempted to emit '${event}' but socket for namespace ${namespace} is not connected.`,
        );
      }
    },

    /**
     * Checks if the socket connection for this client is currently active.
     * @returns True if connected, false otherwise.
     */
    isConnected(): boolean {
      return socket?.connected || false;
    },
  };
  return client;
};
