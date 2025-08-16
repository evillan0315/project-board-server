## TerminalGateway (WebSockets)

`TerminalGateway` provides real-time, interactive terminal capabilities to clients using WebSockets (Socket.IO). It supports both local shell sessions and remote SSH sessions, enabling a fully interactive command-line interface directly within client applications.

### WebSocket Configuration

- **Gateway:** `@WebSocketGateway({ cors: { origin: '*' }, namespace: 'terminal' })`
  - `cors`: Allows cross-origin connections.
  - `namespace`: Defines a dedicated namespace (`/terminal`) for all terminal-related WebSocket events.
- **Guards:** `JwtAuthGuard`, `RolesGuard` - All WebSocket events are protected, requiring a valid JWT and `ADMIN` role for access.

### Internal State

- `cwdMap: Map<string, string>`: Maps client IDs to their current working directory for local terminal sessions.
- `sshClientMap: Map<string, SSHClient>`: Stores active SSH client instances for persistent remote connections.
- `sshStreamMap: Map<string, any>`: Stores active SSH shell streams (e.g., `PtyStream`) for sending input and receiving output.

### Lifecycle Hooks

- **`handleConnection(client: Socket)`:** Called when a new client connects.
  - Authenticates the client using the JWT token from `handshake.auth`.
  - Initializes a local PTY session for the client via `TerminalService.initializePtySession`.
  - Emits initial welcome messages, system info (`osinfo`), and the current working directory.
  - Sets up a listener for `disconnect` events.
- **`handleDisconnect(client: Socket)`:** Called when a client disconnects.
  - Disposes of the client's local PTY session (`TerminalService.dispose`).
  - Disposes of any active SSH session (`disposeSsh`).
  - Cleans up `cwdMap` entries.

### WebSocket Event Handlers (`@SubscribeMessage`)

#### `exec_terminal`

- **Event Name:** `exec_terminal`
- **Description:** The primary event for sending commands to either the local PTY or an active SSH session. It also handles changing directories (`cd`) and providing system info (`osinfo`) directly.
- **Payload (`ExecDto`):**
  - `command`: `string` (optional) - The shell command to execute.
  - `newCwd`: `string` (optional) - A new current working directory to switch to.
- **Behavior:**
  - If `newCwd` is provided, attempts to change the local CWD for the client's session.
  - If an SSH session is active (`sshStreamMap` has entry), the command is written to the SSH stream.
  - If no SSH session, and the command is `cd` or `osinfo`, it's handled internally.
  - Otherwise, the command is written to the client's local PTY session (`terminalService.write`).
  - Emits `prompt` event with the current CWD and command.

#### `ssh-connect`

- **Event Name:** `ssh-connect`
- **Description:** Establishes a new SSH connection to a remote server.
- **Payload:** `{ host: string; port?: number; username: string; password?: string; privateKey?: string; }` - SSH connection details.
- **Behavior:**
  - Creates a new `ssh2.Client` instance.
  - Attempts to connect using the provided credentials (password or private key).
  - On successful connection, requests a shell stream and associates it with the client's ID.
  - Streams all data from the SSH session back to the client via `output` event.
  - Handles SSH errors and session closure.

#### `input`

- **Event Name:** `input`
- **Description:** Sends raw input (e.g., keystrokes) to the active terminal session (either local PTY or SSH stream).
- **Payload:** `{ input: string }` - The raw input string.
- **Behavior:**
  - If an SSH stream is active, writes input to the SSH stream.
  - Otherwise, writes input to the local PTY session (`terminalService.write`).

#### `resize`

- **Event Name:** `resize`
- **Description:** Adjusts the dimensions of the active terminal session (local PTY or SSH).
- **Payload:** `{ cols: number; rows: number; }` - New column and row dimensions.
- **Behavior:**
  - Calls `terminalService.resize` for the local PTY.
  - (Note: For SSH, the `ssh2` library typically handles resizing automatically if the PTY is allocated with proper dimensions, or via `stream.setWindowChange` if supported.)

#### `close`

- **Event Name:** `close`
- **Description:** Explicitly closes the active terminal sessions for the client.
- **Behavior:**
  - Calls `terminalService.dispose` for the local PTY.
  - Calls `disposeSsh` to end the SSH client connection.
