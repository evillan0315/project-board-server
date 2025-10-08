// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { ExecDto, SSHConnectPayload, ResizePayload } from '@/types';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  connect(
    token: string,
    initialCwd?: string,
    namespace?: string,
  ): Promise<void> {
    const terminalNS = '/terminal';

    return new Promise((resolve, reject) => {
      try {
        const initialCwdFromEnv =
          projectRootDirectoryStore.get() || import.meta.env.VITE_BASE_DIR;

        this.socket = io(`${namespace ? namespace : terminalNS}`, {
          auth: {
            token: `Bearer ${token}`,
          },
          query:
            initialCwd || initialCwdFromEnv
              ? { initialCwd: initialCwd || initialCwdFromEnv }
              : undefined,
        });

        this.socket.on('connect', () => {
          console.log('Connected to terminal server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        // Register all stored listeners
        this.listeners.forEach((callback, event) => {
          this.socket?.on(event, callback);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.listeners.set(event, callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string): void {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  execCommand(command: string, newCwd?: string): void {
    const payload: ExecDto = { command };
    if (newCwd) {
      payload.newCwd = newCwd;
    }
    this.emit('exec_terminal', payload);
  }

  setCwd(cwd: string): void {
    this.emit('set_cwd', { cwd });
  }

  resize(cols: number, rows: number): void {
    this.emit('resize', { cols, rows } as ResizePayload);
  }

  sshConnect(config: SSHConnectPayload): void {
    this.emit('ssh-connect', config);
  }

  sendInput(input: string): void {
    this.emit('input', { input });
  }

  closeSession(): void {
    this.emit('close');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
