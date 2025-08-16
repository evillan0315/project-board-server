## Terminal Module Data Transfer Objects (DTOs)

DTOs define the structure of data payloads for requests and responses within the Terminal module's HTTP and WebSocket APIs. They ensure data consistency, facilitate validation, and are used for Swagger API documentation.

### `ExecDto`

Used for sending commands to the WebSocket-based interactive terminal (both local and SSH sessions).

- `command`: `string` (optional) - The shell command to execute (e.g., `'ls -la'`). If omitted, usually implies a CWD change only.
- `newCwd`: `string` (optional) - The new current working directory to switch to (e.g., `'./src'`). If provided, the terminal will attempt to change directories before executing any command.

### `SshCommandDto`

Used for executing one-off SSH commands via the HTTP API.

- `host`: `string` (required) - The hostname or IP address of the remote SSH server.
- `port`: `number` (optional, default: `22`) - The port number for the SSH connection.
- `username`: `string` (required) - The username to use for SSH authentication.
- `password`: `string` (optional) - The password for password-based SSH authentication. One of `password` or `privateKeyPath` must be provided.
- `privateKeyPath`: `string` (optional) - The file path to the SSH private key for key-based authentication. One of `password` or `privateKeyPath` must be provided.
- `command`: `string` (required) - The shell command to execute on the remote server.

### `TerminalCommandDto`

Used for executing one-off local terminal commands via the HTTP API.

- `command`: `string` (required) - The shell command to execute locally (e.g., `'npm install'`).
- `cwd`: `string` (required) - The current working directory in which the command should be executed (e.g., `'./project-board-server'` or `'/home/user/my-app'`).
