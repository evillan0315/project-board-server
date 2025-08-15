## RemoteFileService

`RemoteFileService` provides the core logic for establishing and managing secure connections to remote servers using SSH and SFTP protocols. It abstracts the complexities of `ssh2` library interactions, offering high-level methods for file manipulation and command execution on remote machines.

### Dependencies

- `ssh2`: The underlying library for SSH and SFTP client functionalities.
- `path-module`: Node.js built-in module for path manipulation (especially `pathModule.posix` for remote paths).
- `fs`: Node.js built-in module for file system operations (specifically `createWriteStream` for file downloads).
- `Logger`: For logging connection statuses and errors.

### Core Functionality

- **SSH/SFTP Connection Management:** Handles establishing and tearing down SSH and SFTP connections securely.
- **Remote File Operations:** Provides methods to download, create, update, and delete files on a remote server.
- **Remote Command Execution:** Allows running arbitrary shell commands on the remote server and capturing their output.
- **Recursive Directory Listing:** Capable of listing files and directories on a remote server, with options for recursion depth and file limits.

### Methods

#### `connectSftp(config: ConnectConfig): Promise<{ client: Client; sftp: SFTPWrapper }>`

Establishes an SFTP connection to the remote server using the provided SSH configuration. Returns the SSH client and the SFTP wrapper object.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration (host, port, username, private key, passphrase).
- **Throws:** `InternalServerErrorException` on connection or SFTP session errors.

#### `downloadFile(config: ConnectConfig, remotePath: string, localPath: string): Promise<void>`

Downloads a file from the remote server to a specified local path on the application server.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration.
  - `remotePath`: `string` - The full path of the file on the remote server.
  - `localPath`: `string` - The path to save the file locally.
- **Throws:** `InternalServerErrorException` if the remote read stream or local write stream fails.

#### `createOrUpdateFile(config: ConnectConfig, remotePath: string, content: string, requireExistence = false): Promise<void>`

Creates a new file on the remote server with the given content, or updates an existing one. Optionally, can be configured to only update if the file already exists.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration.
  - `remotePath`: `string` - The path of the file on the remote server.
  - `content`: `string` - The content to write to the file.
  - `requireExistence`: `boolean` (optional, default `false`) - If `true`, throws `NotFoundException` if the file does not exist.
- **Throws:** `NotFoundException` (if `requireExistence` is true and file not found), `InternalServerErrorException` on write errors.

#### `deleteFile(config: ConnectConfig, remotePath: string): Promise<void>`

Deletes a file on the remote server.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration.
  - `remotePath`: `string` - The path of the file to delete on the remote server.
- **Throws:** `NotFoundException` if file does not exist, `InternalServerErrorException` on delete errors.

#### `runCommand(config: ConnectConfig, command: string): Promise<{ stdout: string; stderr: string }>`

Executes a shell command on the remote server via SSH and captures its standard output and standard error.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration.
  - `command`: `string` - The shell command to execute.
- **Returns:** An object containing `stdout` and `stderr` as strings.
- **Throws:** `InternalServerErrorException` on command execution errors.

#### `listFilesAndDirectories(config: ConnectConfig, remotePath: string, options?: { maxDepth?: number; maxFiles?: number }): Promise<RemoteFileListResult>`

Recursively lists files and directories on the remote server, starting from `remotePath`. Supports controlling the maximum recursion depth and the maximum number of files to retrieve.

- **Parameters:**
  - `config`: `ConnectConfig` - SSH connection configuration.
  - `remotePath`: `string` - The starting directory path on the remote server.
  - `options`: `{ maxDepth?: number; maxFiles?: number }` (optional) - Options for controlling recursion and limits.
- **Returns:** A `RemoteFileListResult` object containing arrays of `RemoteFileEntry` and `RemoteDirectoryEntry`.
- **Throws:** `InternalServerErrorException` on connection or directory read errors.

### Private Helper Methods

- `connectSsh(config: ConnectConfig)`: Establishes a raw SSH connection.
- `fileExists(sftp: SFTPWrapper, remotePath: string)`: Checks if a file exists on the remote server using SFTP `stat`.
- `writeFileAsync(sftp: SFTPWrapper, remotePath: string, content: string)`: Promisified `sftp.writeFile`.
- `deleteFileAsync(sftp: SFTPWrapper, remotePath: string)`: Promisified `sftp.unlink`.
- `readdirAsync(sftp: SFTPWrapper, path: string)`: Promisified `sftp.readdir`.
- `statAsync(sftp: SFTPWrapper, path: string)`: Promisified `sftp.stat`.
- `readDirectoryRecursive(...)`: Internal recursive function for `listFilesAndDirectories`.
