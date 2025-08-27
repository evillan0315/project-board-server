// full-stack/src/shared/constants/socket.constants.ts
// Re-creating the dynamic generation logic found in frontend for consistency.

export const HTTP_STATUS = {
  PROGRESS: 'Progress',
  RESPONSE: 'Response',
  ERROR: 'Error',
} as const;

// Simplified API_ENDPOINTS structure just for key extraction
// This mirrors the structure of code-editor/src/constants/refactored/api.ts
const BACKEND_API_ENDPOINTS_KEYS = {
  _FILE: {
    CLOSE_FILE: true,
    COPY_FILE_OR_FOLDER: true,
    CREATE: true,
    CREATE_FOLDER: true,
    DELETE_FILE: true,
    GET_FILES: true,
    MOVE_FILE_OR_FOLDER: true,
    OPEN_FILE: true,
    READ_FILE_CONTENT: true,
    READ_MULTIPLE_FILES: true, // Note: This operation might remain HTTP only for file uploads
    RENAME_FILE_OR_FOLDER: true,
    SCAN_FILE: true,
    SEARCH_FILES: true,
    WRITE_FILE_CONTENT: true,
  },
  // Add other modules if they will also use websockets
  _ESLINT: {
    LINT_CODE: true,
    LINT_DIRECTORY: true,
    LINT_FILES: true,
  },
  _GOOGLE_GEMINI: {
    ANALYZE_CODE: true,
    GENERATE_CODE: true,
    GENERATE_CODE_DOCUMENTATION: true,
    OPTIMIZE_CODE: true,
    REPAIR_CODE: true,
  },
  _LLM: {
    GENERATE_CONTENT: true,
    GET_PROJECT_STRUCTURE: true,
  },
  // ... other API groups if needed for WebSocket events
} as const;

// Helper to convert string to camelCase
const toCamelCase = (str: string): string => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

export const EVENT_PREFIX: { [key: string]: string } = {};

// Populate EVENT_PREFIX based on BACKEND_API_ENDPOINTS_KEYS
for (const groupKey in BACKEND_API_ENDPOINTS_KEYS) {
  if (Object.prototype.hasOwnProperty.call(BACKEND_API_ENDPOINTS_KEYS, groupKey)) {
    const groupEndpoints =
      BACKEND_API_ENDPOINTS_KEYS[groupKey as keyof typeof BACKEND_API_ENDPOINTS_KEYS];

    const baseGroupName = toCamelCase(groupKey.substring(1)); // e.g., "file", "eslint"

    for (const endpointKey in groupEndpoints) {
      if (Object.prototype.hasOwnProperty.call(groupEndpoints, endpointKey)) {
        const constantName = `${groupKey.toUpperCase().substring(1)}_${endpointKey}`; // e.g., FILE_CREATE

        const endpointCamelCase = toCamelCase(endpointKey);
        const eventPrefixValue =
          baseGroupName + endpointCamelCase.charAt(0).toUpperCase() + endpointCamelCase.slice(1);

        EVENT_PREFIX[constantName] = eventPrefixValue;
      }
    }
  }
}
Object.freeze(EVENT_PREFIX);

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  DYNAMIC_FILE_EVENT: 'dynamicFileEvent', // This might be removed if replaced by specific events

  // File system watcher events - these are general, not API-specific
  FS_CHANGE_CREATED: 'fsChangeCreated',
  FS_CHANGE_DELETED: 'fsChangeDeleted',
  FS_CHANGE_RENAMED: 'fsChangeRenamed',
  FS_CHANGE_MODIFIED: 'fsChangeModified',
} as const;

const mutableSocketEvents: Record<string, string> = { ...SOCKET_EVENTS };

for (const prefixConstantName in EVENT_PREFIX) {
  if (Object.prototype.hasOwnProperty.call(EVENT_PREFIX, prefixConstantName)) {
    const prefixValue = EVENT_PREFIX[prefixConstantName];

    for (const statusKey in HTTP_STATUS) {
      if (Object.prototype.hasOwnProperty.call(HTTP_STATUS, statusKey)) {
        const statusValue = HTTP_STATUS[statusKey as keyof typeof HTTP_STATUS];

        const fullConstantName = `${prefixConstantName}_${statusKey.toUpperCase()}`;
        const eventString = `${prefixValue}${statusValue}`;
        mutableSocketEvents[fullConstantName] = eventString;
      }
    }
  }
}

export const SOCKET_EVENTS_MERGED = Object.freeze(mutableSocketEvents);

export const FILE_NAMESPACE = '/files';
export const TERMINAL_NAMESPACE = '/terminal';
export const AUDIO_NAMESPACE = '/audio';
export const LLM_NAMESPACE = '/llm';
export const FFMPEG_NAMESPACE = '/ffmpeg';

// Exported for convenience in other modules
export { EVENT_PREFIX as BackendEventPrefix };
