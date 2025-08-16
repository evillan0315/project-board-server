## TerminalService

`TerminalService` manages the core logic for interacting with shell environments. It handles spawning local pseudo-terminal (PTY) processes, executing one-off commands (both local and remote SSH), and managing SSH client connections.

### Dependencies

- `node-pty`: For creating interactive local shell sessions.
- `ssh2`: For connecting to remote SSH servers and executing commands.
- `child_process`: Node.js built-in module for spawning one-off local processes.
- `fs` (`readFileSync`): For reading SSH private key files.
- `socket.io` (`Socket` type): To emit data back to specific WebSocket clients.

### Core Functionality

- **Persistent PTY Sessions:** Manages long-lived interactive shell sessions for each connected WebSocket client.
- **One-Off Command Execution:** Provides methods for executing non-interactive commands.
- **SSH Connection Management:** Handles the details of connecting to and executing commands on remote SSH servers.

### Properties

- `defaultShell`: `string` - The default shell to use for local PTY sessions (e.g., `bash` on Linux/macOS, `powershell.exe` on Windows).
- `sessions: Map<string, TerminalSession>`: Stores active local PTY sessions, mapped by client ID.

### Methods

#### `initializePtySession(sessionId: string, client: Socket, cwd: string): void`

Initializes and manages a persistent pseudo-terminal (PTY) session for a given client. This session streams stdout/stderr back to the client and receives input.

- **Parameters:**
  - `sessionId`: `string` - The unique ID of the client's WebSocket connection.
  - `client`: `Socket` - The `socket.io` client instance.
  - `cwd`: `string` - The initial current working directory for the PTY.
- **Behavior:**
  - Spawns a `node-pty` process for the `defaultShell`.
  - Attaches event listeners to stream `onData` from the PTY back to the client via `client.emit('output')`.
  - Handles PTY `onExit` events to clean up the session.
  - Resizes the PTY to default dimensions (80x30).

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

#### `dispose(sessionId: string): void`

Disposes of an active PTY session, terminating the underlying process.

- **Parameters:**
  - `sessionId`: `string` - The ID of the client's session.

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
