## TerminalController

`TerminalController` provides HTTP API endpoints for executing shell commands, both locally on the server and remotely via SSH. All endpoints require `ADMIN` role authentication.

### Endpoints

All endpoints are prefixed with `/api/terminal`.

#### `POST /ssh/run`

- **Summary:** Execute SSH command on a remote server.
- **Description:** Runs a single SSH command on a remote Linux server. Supports both password and private key authentication. Returns the standard output or error from the command.
- **Roles:** `ADMIN`
- **Request Body:** [`SshCommandDto`](./DTOs.md) - Contains host, port, username, password/private key path, and the command.
- **Responses:**
  - `200 OK`: Command executed successfully, returns stdout.
  - `400 Bad Request`: Invalid input or SSH command failed (e.g., authentication error, command not found).
  - `401 Unauthorized`: No valid JWT token provided.
  - `403 Forbidden`: User does not have `ADMIN` role.

#### `POST /run`

- **Summary:** Execute a terminal command locally.
- **Description:** Runs a single local terminal command on the server where the NestJS application is hosted. Returns the standard output, standard error, and exit code.
- **Roles:** `ADMIN`
- **Request Body:** [`TerminalCommandDto`](./DTOs.md) - Contains the command string and current working directory (`cwd`).
- **Responses:**
  - `200 OK`: Command executed successfully, returns `{ stdout, stderr, exitCode }`.
  - `400 Bad Request`: Invalid input or command failed.
  - `401 Unauthorized`: No valid JWT token provided.
  - `403 Forbidden`: User does not have `ADMIN` role.
