## FileGateway (WebSockets)

`FileGateway` facilitates real-time, bidirectional communication for file operations using WebSockets (Socket.IO). It allows multiple clients to interact with the file system and receive live updates, enabling collaborative features like synchronized file editing.

### WebSocket Configuration

- **Gateway:** `@WebSocketGateway({ cors: { origin: '*' }, namespace: '/files' })`
  - `cors`: Allows cross-origin connections.
  - `namespace`: Defines a dedicated namespace (`/files`) for all file-related WebSocket events, helping organize communication.
- **Guards:** `JwtAuthGuard`, `RolesGuard` - All WebSocket events are protected, requiring a valid JWT and potentially specific user roles for access.

### Lifecycle Hooks

- **`afterInit(server: Server)`:** Called once after the gateway is initialized. Stores the `socket.io` server instance.
- **`handleConnection(client: Socket)`:** Called when a new client connects.
  - Validates the client's JWT token (extracted from `handshake.auth.token`).
  - If no token or malformed, disconnects the client with an `UnauthorizedException`.
- **`handleDisconnect(client: Socket)`:** Called when a client disconnects.
  - Removes the client from the `fileEditorsMap` for any files they were editing, cleaning up collaboration state.

### Internal State

- `fileEditorsMap: Map<string, Set<string>>`: A map that tracks which `filePath` is currently being edited by which `socket.id`s. This is crucial for notifying other collaborators about file changes.

### WebSocket Event Handlers (`@SubscribeMessage`)

#### `dynamicFileEvent`

- **Event Name:** `dynamicFileEvent`
- **Description:** A versatile event that allows clients to trigger arbitrary HTTP API calls (GET, POST, PUT, DELETE) to the NestJS backend via the WebSocket connection. This provides a way to interact with REST endpoints without direct HTTP requests, potentially with added benefits like progress tracking.
- **Payload (`ApiDataProps`):**
  - `endpoint`: `string` - The backend API endpoint (e.g., `/api/file/read`).
  - `method`: `Method` - HTTP method (`'GET'`, `'POST'`, etc.).
  - `body`: `any` (optional) - Request body for POST/PUT requests.
  - `event`: `string` - A unique event name for the response (e.g., `readFile`).
  - `params`: `string` (optional) - Query parameters.
  - `responseType`: `string` (optional) - Axios `responseType`.
  - `headers`: `string` (optional) - Custom headers.
- **Response Events:**
  - `${data.event}Response`: Emitted with the API response data on success.
  - `${data.event}Error`: Emitted with an error message on failure.
  - `${data.event}Progress`: Emitted for upload/download progress updates.

#### `openFile`

- **Event Name:** `openFile`
- **Description:** Allows a client to request the content of a local file. The server reads the file and sends its content back to the requesting client.
- **Payload:** `{ path: string }` - The path to the file to open.
- **Response Events:**
  - `openFileResponse`: Emitted to the requesting client with `{ path: string, content: string }`.
  - `openFileError`: Emitted on error (e.g., file not found, permission issue).
- **Collaboration:** Adds the client's `socket.id` to the `fileEditorsMap` for the opened file, marking them as an active editor.

#### `closeFile`

- **Event Name:** `closeFile`
- **Description:** Informs the server that a client is no longer editing a specific file. Cleans up the collaboration state.
- **Payload:** `{ path: string }` - The path of the file being closed.
- **Response Events:**
  - `closeFileResponse`: Emitted to the requesting client with `{ path: string }`.
  - `closeFileError`: Emitted on error.
- **Collaboration:** Removes the client's `socket.id` from the `fileEditorsMap` for the specified file. If no other editors remain, the file entry is removed from the map.

#### `updateFile`

- **Event Name:** `updateFile`
- **Description:** Allows a client to send updated content for a local file. The server writes this content to the file system and then notifies _other_ active editors of the same file about the change.
- **Payload:** `{ filePath: string; content: string }` - The path and new content of the file.
- **Response Events:**
  - `updateFileResponse`: Emitted to the requesting client with `{ path: string, success: boolean }`.
  - `updateFileError`: Emitted on error (e.g., write error, permission issue).
  - `fileUpdated`: Emitted to _other_ clients editing the same file, with `{ path: string, message: string }`, indicating an external modification.

#### `createFile`

- **Event Name:** `createFile`
- **Description:** Allows a client to create a new local file with optional initial content. Parent directories are created recursively if they do not exist.
- **Payload:** `{ filePath: string; content?: string }`
- **Response Events:**
  - `createFileResponse`: Emitted to the requesting client with `{ path: string, success: boolean }`.
  - `createFileError`: Emitted on error.

#### `deleteFile`

- **Event Name:** `deleteFile`
- **Description:** Allows a client to request the deletion of a local file.
- **Payload:** `{ filePath: string }`
- **Response Events:**
  - `deleteFileResponse`: Emitted to the requesting client with `{ path: string, success: boolean }`.
  - `deleteFileError`: Emitted on error (e.g., file not found, permission issue).
