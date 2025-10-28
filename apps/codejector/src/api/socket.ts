import { io, Socket } from 'socket.io-client';
import { getToken } from '@/stores/authStore';
import { atom } from 'nanostores';
import { FileOperationResult, CopyResult, MoveResult } from '@/types/file'; // Import FileOperationResult
import { projectRootDirectoryStore, isConnected } from '@/stores/fileTreeStore';
// Determine WebSocket URL based on environment variables
const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  } else if (import.meta.env.VITE_API_URL) {
    // Assuming WebSocket path is /files relative to the API base URL's host
    const url = new URL(import.meta.env.VITE_API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/files`;
  }
  // Fallback for development if no env var is set
  return 'http://localhost:5000/files';
};

// --- Interfaces and Types ---

/**
 * Represents the payload structure for dynamic WebSocket events sent to the backend.
 */
export interface ApiDataProps {
  endpoint: string; // The backend HTTP API endpoint to call (e.g., '/api/file/read')
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // HTTP method for the API call
  body?: any; // Request body
  event: string; // A unique identifier for the specific operation (e.g., 'fileReadFileContent')
  params?: Record<string, any>; // Query parameters for GET requests
  responseType?:
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text'
    | 'stream';
  headers?: Record<string, string>; // Additional headers for the API call
}

/**
 * Represents the structure of a progress event emitted by the backend.
 */
export interface ProgressEventPayload {
  loaded: number;
  total: number;
  percent: number;
  type: 'download' | 'upload';
}

/**
 * Represents the structure of a WebSocket response from the backend.
 */
export interface WsResponse<T> {
  event: string; // The event name (e.g., 'fileReadFileContentResponse')
  data: T; // The response data
}

/**
 * A simple Nanostore to hold the connection status.
 */
export const isConnected = atom(false);

// --- Socket Service Implementation ---

class SocketService {
  private socket: Socket | null = null;
  private wsUrl: string;

  constructor() {
    this.wsUrl = '/files';
  }

  /**
   * Connects to the WebSocket server.
   * @param token Optional JWT token for authentication.
   */
  public connect(token?: string, initialCwd?: string): void {
    if (this.socket && this.socket.connected) {
      console.warn('Socket already connected.');
      return;
    }

    const authToken = token || getToken();
    if (!authToken) {
      console.error(
        'No authentication token available for WebSocket connection.',
      );
      // Attempt to connect without token, may be rejected by gateway
    }
    const initialCwdFromEnv =
      projectRootDirectoryStore.get() || import.meta.env.VITE_BASE_DIR;

    this.socket = io(`${this.wsUrl}`, {
      auth: {
        token: `Bearer ${authToken}`,
      },
      query:
        initialCwd || initialCwdFromEnv
          ? { initialCwd: initialCwd || initialCwdFromEnv }
          : undefined,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      isConnected.set(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      isConnected.set(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      isConnected.set(false);
      // Optionally, attempt to reconnect or notify user
    });
  }

  /**
   * Disconnects from the WebSocket server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      isConnected.set(false);
      console.log('WebSocket disconnected successfully.');
    }
  }

  /**
   * Emits a generic event to the WebSocket server and returns a Promise that resolves with the response data.
   * Automatically handles success and error responses based on the `event` field in `ApiDataProps`.
   * Also provides an optional callback for progress updates.
   * @param eventName The base event name (e.g., 'fileReadFileContent').
   * @param data The payload for the backend's dynamic event handler (`ApiDataProps`).
   * @param onProgress Optional callback for progress updates.
   * @returns A Promise that resolves with the response data or rejects with an error.
   */
  public emit<T>(
    eventName: string,
    data: ApiDataProps,
    onProgress?: (progress: ProgressEventPayload) => void,
  ): Promise<T> {
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('WebSocket is not connected.'));
    }

    const responseEvent = `${eventName}Response`;
    const errorEvent = `${eventName}Error`;
    const progressEvent = `${eventName}Progress`;

    return new Promise((resolve, reject) => {
      if (onProgress) {
        this.socket?.on(progressEvent, onProgress);
      }

      this.socket?.emit(
        'dynamicFileEvent',
        data,
        (response: WsResponse<T> | { message: string; data?: any }) => {
          // Adjusted response type for error handling
          // Unregister progress listener after the main response is received
          if (onProgress) {
            this.socket?.off(progressEvent, onProgress);
          }

          if (
            response &&
            'event' in response &&
            response.event === responseEvent
          ) {
            resolve(response.data);
          } else if (
            response &&
            'event' in response &&
            response.event === errorEvent
          ) {
            reject(
              new Error(
                response.data?.message ||
                  response.message ||
                  'An unknown error occurred.',
              ),
            );
          } else if (response && 'message' in response) {
            reject(new Error(response.message));
          } else {
            reject(new Error('Unknown response format.'));
          }
        },
      );

      // Set a timeout for the response
      const timeoutId = setTimeout(() => {
        if (onProgress) {
          this.socket?.off(progressEvent, onProgress);
        }
        reject(new Error(`Operation '${eventName}' timed out.`));
      }, 30000); // 30 second timeout

      // Clear timeout if response is received before timeout
      this.socket?.once(responseEvent, () => clearTimeout(timeoutId));
      this.socket?.once(errorEvent, () => clearTimeout(timeoutId));
    });
  }

  /**
   * Registers a listener for a specific WebSocket event.
   * @param event The event name to listen for.
   * @param callback The callback function to execute when the event is received.
   */
  public on<T>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * Removes a listener for a specific WebSocket event.
   * @param event The event name to remove the listener from.
   * @param callback The callback function to remove.
   */
  public off<T>(event: string, callback: (data: T) => void): void {
    this.socket?.off(event, callback);
  }

  // --- Specific File Operation Methods ---

  /**
   * Reads the content of a file.
   * @param filePath The path to the file.
   * @param projectId The ID of the project the file belongs to.
   * @param onProgress Optional callback for progress updates during download.
   * @returns A Promise that resolves with the file content.
   */
  public readFile(
    filePath: string,
    projectId: string,
    onProgress?: (progress: ProgressEventPayload) => void,
  ): Promise<string> {
    return this.emit<string>(
      'fileReadFileContent',
      {
        endpoint: '/api/file/read',
        method: 'POST',
        body: { path: filePath, projectId },
        event: 'fileReadFileContent',
        responseType: 'text',
      },
      onProgress,
    );
  }

  /**
   * Writes content to a file.
   * @param filePath The path to the file.
   * @param content The content to write.
   * @param projectId The ID of the project the file belongs to.
   * @param onProgress Optional callback for progress updates during upload.
   * @returns A Promise that resolves when the file is written.
   */
  public writeFile(
    filePath: string,
    content: string,
    projectId: string,
    onProgress?: (progress: ProgressEventPayload) => void,
  ): Promise<FileOperationResult> {
    // Changed return type
    return this.emit<FileOperationResult>(
      'fileWriteFileContent',
      {
        endpoint: '/api/file/write',
        method: 'POST',
        body: { path: filePath, content, projectId },
        event: 'fileWriteFileContent',
      },
      onProgress,
    );
  }

  /**
   * Creates a new file or folder.
   * @param filePath The path for the new file/folder.
   * @param type 'file' or 'folder'.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the operation result.
   */
  public createFileOrFolder(
    filePath: string,
    type: 'file' | 'folder',
    projectId: string,
  ): Promise<FileOperationResult & { path: string }> {
    // Changed return type
    return this.emit<FileOperationResult & { path: string }>(
      'fileCreateFileOrFolder',
      {
        endpoint: '/api/file/create',
        method: 'POST',
        body: { path: filePath, type, projectId },
        event: 'fileCreateFileOrFolder',
      },
    );
  }

  /**
   * Deletes a file or folder.
   * @param filePath The path to the file/folder to delete.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the operation result.
   */
  public deleteFileOrFolder(
    filePath: string,
    projectId: string,
  ): Promise<FileOperationResult> {
    return this.emit<FileOperationResult>('fileDeleteFileOrFolder', {
      endpoint: '/api/file/delete',
      method: 'POST',
      body: { path: filePath, projectId },
      event: 'fileDeleteFileOrFolder',
    });
  }

  /**
   * Renames a file or folder.
   * @param oldPath The current path.
   * @param newPath The new path.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the operation result.
   */
  public renameFileOrFolder(
    oldPath: string,
    newPath: string,
    projectId: string,
  ): Promise<FileOperationResult> {
    return this.emit<FileOperationResult>('fileRenameFileOrFolder', {
      endpoint: '/api/file/rename',
      method: 'POST',
      body: { oldPath, newPath, projectId },
      event: 'fileRenameFileOrFolder',
    });
  }

  /**
   * Copies a file or folder from a source path to a destination path.
   * @param sourcePath The path of the file/folder to copy.
   * @param destinationPath The destination path for the copied item.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the copy operation result.
   */
  public copyFileOrFolder(
    sourcePath: string,
    destinationPath: string,
    projectId: string,
  ): Promise<CopyResult> {
    return this.emit<CopyResult>('fileCopyFileOrFolder', {
      endpoint: '/api/file/copy',
      method: 'POST',
      body: { sourcePath, destinationPath, projectId },
      event: 'fileCopyFileOrFolder',
    });
  }

  /**
   * Moves a file or folder from a source path to a destination path.
   * @param sourcePath The path of the file/folder to move.
   * @param destinationPath The destination path for the moved item.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the move operation result.
   */
  public moveFileOrFolder(
    sourcePath: string,
    destinationPath: string,
    projectId: string,
  ): Promise<MoveResult> {
    return this.emit<MoveResult>('fileMoveFileOrFolder', {
      endpoint: '/api/file/move',
      method: 'POST',
      body: { sourcePath, destinationPath, projectId },
      event: 'fileMoveFileOrFolder',
    });
  }

  /**
   * Scans a directory and returns its contents.
   * This method typically returns a flat list of files/folders for AI context or similar.
   * For hierarchical tree display, a different endpoint/method might be more suitable.
   * @param directoryPath The path to the directory.
   * @param projectId The ID of the project.
   * @returns A Promise that resolves with the directory contents (likely `ApiFileScanResult[]` or `FileTreeNode[]` depending on backend implementation of `/api/file/scan`).
   */
  public scanDirectory(directoryPath: string, projectId: string): Promise<any> {
    return this.emit<any>('fileScanDirectory', {
      endpoint: '/api/file/list',
      method: 'POST',
      body: { directory: directoryPath, recursive: false },
      event: 'listDirectory',
    });
  }

  // Add more file-related methods here as needed, following the pattern

  /**
   * Subscribes to real-time updates for a specific file.
   * The backend `FileGateway` might emit `fileUpdated` or `fileClosed` events.
   * @param filePath The path to the file to subscribe to.
   * @param callback The callback to execute when updates are received.
   */
  public subscribeToFileUpdates<T>(
    filePath: string,
    callback: (data: T) => void,
  ): void {
    // This assumes the backend emits file-specific events like 'fileUpdated:{filePath}'
    // or a more generic 'fileUpdated' event with a payload containing the file path.
    // Adjust the event name if the backend uses a different convention.
    this.on(`fileUpdated:${filePath}`, callback);
    console.log(`Subscribed to updates for file: ${filePath}`);
  }

  /**
   * Unsubscribes from real-time updates for a specific file.
   * @param filePath The path to the file.
   * @param callback The callback to remove.
   */
  public unsubscribeFromFileUpdates<T>(
    filePath: string,
    callback: (data: T) => void,
  ): void {
    this.off(`fileUpdated:${filePath}`, callback);
    console.log(`Unsubscribed from updates for file: ${filePath}`);
  }
}

export const socketService = new SocketService();
