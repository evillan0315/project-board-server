## File & Folder Management Module Overview

The File & Folder Management module provides a comprehensive set of functionalities for interacting with both local and remote file systems. It supports various operations from basic file CRUD to advanced media streaming, AI-driven project scanning, and real-time collaborative editing.

### Key Features

- **Local File System Operations:** Create, read, update, delete, rename, list, and search files and folders on the local server.
- **File Upload & Download:** Handles single and multiple file uploads, and offers direct file downloads.
- **Media Streaming:** Supports streaming of media files with HTTP range requests for efficient audio/video playback.
- **Remote File Operations (SSH/SFTP):** Connects to remote servers via SSH/SFTP to list directories, manage files, and execute shell commands.
- **AI Context Scanning:** Recursively scans project directories to identify and extract content from relevant code files, crucial for AI agent context building.
- **Real-time Collaboration:** Provides WebSocket capabilities for real-time file updates and notifications among multiple users (editors).
- **File Type & Language Detection:** Automatically identifies MIME types and programming languages for better content handling.
- **Image Proxying:** Proxies external image URLs through the server.

### Core Components

- [`FileController`](./FileController.md): Manages HTTP API endpoints for local file and folder operations.
- [`FileService`](./FileService.md): Contains the core business logic for local file system interactions, file processing, and AI scanning.
- [`FileGateway`](./FileGateway.md): Handles WebSocket communication for real-time file events and collaboration.
- [`FileLanguageService`](./FileLanguageService.md): Determines file programming languages and provides Prettier parsers based on file properties.
- [`RemoteFileController`](./RemoteFileController.md): Manages HTTP API endpoints for remote file system operations (SSH/SFTP).
- [`RemoteFileService`](./RemoteFileService.md): Implements the core logic for secure SSH and SFTP connections and operations.
- [`DTOs`](./DTOs.md): Data Transfer Objects for various file-related requests and responses.
- [`Enums`](./Enums.md): Enumerations for file formats.

### Dependencies

The module relies on the following key dependencies:

- `@nestjs/platform-express` (`FileInterceptor`, `FilesInterceptor`): For handling multipart file uploads.
- `fs`, `fs/promises`, `fs-extra`: Node.js file system utilities.
- `path`: Node.js path manipulation utilities.
- `mime-types`: For MIME type detection.
- `axios`: For making HTTP requests to external URLs (e.g., for file fetching, image proxying).
- `ssh2`: For SSH and SFTP connectivity to remote servers.
- `@nestjs/swagger`: For API documentation.
- `ModuleControlService`: For enabling/disabling module functionality.
- `UtilsService`: For utility functions like language detection and environment map parsing.
