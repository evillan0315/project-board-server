## TerminalService

`TerminalService` manages the core logic for interacting with shell environments. It handles spawning local pseudo-terminal (PTY) processes, executing one-off commands (both local and remote SSH), managing SSH client connections, and **persisting terminal session and command history data to the database**.

### Dependencies

- `node-pty`: For creating interactive local shell sessions.
- `ssh2`: For connecting to remote SSH servers and executing commands.
- `child_process`: Node.js built-in module for spawning one-off local processes.
- `fs` (`readFileSync`): For reading SSH private key files.
- `socket.io` (`Socket` type): To emit data back to specific WebSocket clients.
- `PrismaService`: For database interactions with `TerminalSession` and `CommandHistory` models.

### Core Functionality

- **Persistent PTY Sessions:** Manages long-lived interactive shell sessions for each connected WebSocket client, with their lifecycle tracked in the database.
- **Command History Logging:** Records every executed command within a session for auditing and review.
- **One-Off Command Execution:** Provides methods for executing non-interactive commands via HTTP API.
- **SSH Connection Management:** Handles the details of connecting to and executing commands on remote SSH servers.

### Properties

- `defaultShell`: `string` - The default shell to use for local PTY sessions (e.g., `bash` on Linux/macOS, `powershell.exe` on Windows).
- `sessions: Map<string, TerminalSession>`: Stores active local PTY sessions, mapped by client ID. Each entry includes the `ptyProcess`, `clientSocket`, and its associated `dbSessionId`.

### Methods

#### `initializePtySession(sessionId: string, client: Socket, cwd: string, userId: string): Promise<string>`

Initializes and manages a persistent pseudo-terminal (PTY) session for a given client. This session streams stdout/stderr back to the client and receives input. **Crucially, it also creates a new `TerminalSession` record in the database to log the session's start and metadata.**

- **Parameters:**
  - `sessionId`: `string` - The unique ID of the client's WebSocket connection.
  - `client`: `Socket` - The `socket.io` client instance.
  - `cwd`: `string` - The initial current working directory for the PTY.
  - `userId`: `string` - The ID of the authenticated user initiating the session.
- **Behavior:**
  - Spawns a `node-pty` process for the `defaultShell`.
  - **Creates a `TerminalSession` entry in the database, associating it with the `userId` and client connection details.**
  - Attaches event listeners to stream `onData` from the PTY back to the client via `client.emit('output')`.
  - Handles PTY `onExit` events to clean up the session.
  - Resizes the PTY to default dimensions (80x30).
- **Returns:** The `id` of the newly created `TerminalSession` record in the database.

#### `write(sessionId: string, input: string): void`

Writes data (commands or input) to an active PTY session.

- **Parameters:**
  - `sessionId`: `string` - The ID of the client's session.
  - `input`: `string` - The string data to write to the PTY.

#### `resize(sessionId: string, cols: number, rows: number): void`

Resizes the dimensions of an active PTY session.

- **Parameters:**
  - `sessionId`: `string` - The ID of the client's session.
  - `cols`: `number` - The new number of columns.
  - `rows`: `number` - The new number of rows.

#### `dispose(sessionId: string): Promise<void>`

Disposes of an active PTY session, terminating the underlying process. **It also updates the corresponding `TerminalSession` record in the database, setting `endedAt` and updating its `status` to 'ENDED'.**

- **Parameters:**
  - `sessionId`: `string` - The ID of the client's session.

#### `saveCommandHistoryEntry(dbSessionId: string, userId: string, commandData: CreateCommandHistoryDto): Promise<void>`

Saves a command execution entry to the database, linking it to a specific `TerminalSession` and user. This ensures a persistent log of all commands run within interactive sessions.

- **Parameters:**
  - `dbSessionId`: `string` - The ID of the parent `TerminalSession` record in the database.
  - `userId`: `string` - The ID of the user who executed the command.
  - `commandData`: [`CreateCommandHistoryDto`](./DTOs.md) - Contains details about the command, such as the command string, working directory, and status.

#### `runCommandOnce(command: string, cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }>`

Executes a single local shell command using `child_process.spawn`. This is typically used for non-interactive commands initiated via the HTTP API.

- **Parameters:**
  - `command`: `string` - The shell command to execute.
  - `cwd`: `string` - The current working directory for the command.
- **Returns:** A Promise resolving to an object containing `stdout`, `stderr`, and `exitCode`.
- **Throws:** `Error` if the command execution fails.

#### `runSshCommandOnce(options: { host: string; port?: number; username: string; password?: string; privateKeyPath?: string; command: string }): Promise<string>`

Executes a single command on a remote SSH server. Used for one-off SSH commands initiated via the HTTP API.

- **Parameters:**
  - `options`: An object containing SSH connection details and the command to run.
    - `host`: `string` - Remote server hostname or IP.
    - `port`: `number` (optional, default: 22) - SSH port.
    - `username`: `string` - SSH username.
    - `password`: `string` (optional) - Password for authentication.
    - `privateKeyPath`: `string` (optional) - Path to SSH private key file.
    - `command`: `string` - The command to execute on the remote server.
- **Returns:** A Promise resolving to the standard output of the command.
- **Throws:** `Error` if authentication fails, connection fails, or command execution fails.
