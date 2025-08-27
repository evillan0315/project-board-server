// src/shared/interfaces/socket-payloads.interface.ts

// Assuming other imports and definitions exist in this file

/**
 * Type representing the specific file system change events emitted over the socket.
 * This includes dynamically generated events like 'fileCreated' and explicit ones like 'fsChangeRenamed'.
 */
export type FsSpecificChangeEventType =
  | 'fileCreated'
  | 'fileModified'
  | 'fileDeleted'
  | 'folderCreated'
  | 'folderDeleted'
  | 'fsChangeRenamed'; // Explicitly added as it's assigned in handleWatcherEvent

/**
 * Payload structure for file system change events.
 */
export interface FileSystemEventPayload {
  path: string;
  type: 'file' | 'folder'; // Type of the item (file or folder)
  eventType: FsSpecificChangeEventType; // The specific type of file system event
  message: string;
  oldPath?: string; // Optional: For rename operations, indicates the original path
  newPath?: string; // Optional: For rename operations, indicates the new path
}

/**
 * Generic response structure for WebSocket messages.
 */
export interface GenericSocketResponse<T> {
  status: 'Response' | 'Error';
  message?: string;
  data?: T;
  error?: string; // For error responses
}

// You might also need to update ClientSocketEventPayloadMap based on FsSpecificChangeEventType
// Example (adjust as per your actual SOCKET_EVENTS_MERGED definitions):
// export interface ClientSocketEventPayloadMap {
//   [SOCKET_EVENTS_MERGED.FS_CHANGE_CREATED]: FileSystemEventPayload;
//   [SOCKET_EVENTS_MERGED.FS_CHANGE_DELETED]: FileSystemEventPayload;
//   [SOCKET_EVENTS_MERGED.FS_CHANGE_MODIFIED]: FileSystemEventPayload;
//   [SOCKET_EVENTS_MERGED.FS_CHANGE_RENAMED]: FileSystemEventPayload; // If you emit this event
//   // ... other events
// }
