## Terminal Module Overview

The Terminal module provides powerful capabilities for interacting with both local and remote shell environments directly from the backend. It offers functionalities for executing one-off commands via HTTP API and establishing persistent, interactive terminal sessions over WebSockets.

### Key Features

- **Local Command Execution:** Run any shell command on the server where the NestJS application is hosted.
- **Persistent Local PTY Sessions:** Maintain interactive pseudo-terminal sessions for a full local shell experience via WebSockets.
- **Remote SSH Command Execution:** Execute commands on remote Linux servers via SSH.
- **Persistent Remote SSH Sessions:** Establish and interact with remote SSH sessions in real-time via WebSockets.
- **Real-time Input/Output:** Bidirectional communication for commands and their output, enabling a seamless terminal experience.
- **Directory Management:** Change current working directories for local and remote sessions.

### Core Components

- [`TerminalController`](./TerminalController.md): Handles HTTP API endpoints for one-off local and remote command executions.
- [`TerminalService`](./TerminalService.md): Manages the core logic for spawning local PTY processes, running one-off commands, and handling SSH connections.
- [`TerminalGateway`](./TerminalGateway.md): Facilitates real-time interactive terminal sessions (both local and SSH) using WebSockets.
- [`DTOs`](./DTOs.md): Data Transfer Objects for defining command payloads and SSH connection details.

### Dependencies

The module relies on the following key dependencies:

- `node-pty`: For creating and managing pseudo-terminal (PTY) processes locally.
- `ssh2`: For establishing secure SSH connections and running commands on remote servers.
- `child_process`: Node.js built-in module for executing one-off local shell commands.
- `@nestjs/websockets`: For WebSocket communication via Socket.IO.
- `@nestjs/swagger`: For API documentation.
- `AuthModule` & `UserModule`: For authentication and authorization.
