## RemoteFileController

`RemoteFileController` provides HTTP API endpoints for interacting with files and running commands on remote servers via SSH and SFTP. It abstracts away the complexities of direct SSH/SFTP connections, offering a secure way to manage remote environments.

### Security

This controller relies on SSH private keys for authentication. The path to the private key and other SSH connection details are loaded from environment variables (`SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY_PATH`, `SSH_PASSPHRASE`). It's crucial that `SSH_PRIVATE_KEY_PATH` points to a valid and securely stored private key.

### Endpoints

All endpoints are prefixed with `/remote`.

#### `GET /list`

- **Summary:** List files and directories on remote server.
- **Description:** Connects via SSH/SFTP to the remote server and lists files and directories at the specified path, with optional recursion and limits.
- **Query Parameters:**
  - `path` (optional): `string` - Remote directory path to list (defaults to `/`).
  - `maxDepth` (optional): `number` - Maximum recursion depth (default: unlimited).
  - `maxFiles` (optional): `number` - Maximum number of files to list (default: unlimited).
- **Responses:**
  - `200 OK`: [`RemoteFileListDto`](./DTOs.md) - Successfully retrieved list of files and directories.
  - `500 Internal Server Error`: SSH connection or SFTP operation failed.

#### `POST /file`

- **Summary:** Create a new file on remote server.
- **Description:** Creates a new file at the specified remote path with the provided content. If the file already exists, it will be overwritten.
- **Query Parameters:**
  - `path`: `string` - Remote file path to create (e.g., `/var/www/newfile.txt`).
- **Request Body:** [`RemoteFileContentDto`](./DTOs.md)
- **Responses:**
  - `201 Created`: File created.

#### `PUT /file`

- **Summary:** Update an existing file on remote server.
- **Description:** Updates the content of an existing file at the specified remote path. This effectively overwrites the file.
- **Query Parameters:**
  - `path`: `string` - Remote file path to update (e.g., `/var/www/existingfile.txt`).
- **Request Body:** [`RemoteFileContentDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: File updated.

#### `DELETE /file`

- **Summary:** Delete a file on remote server.
- **Description:** Deletes the file at the specified remote path.
- **Query Parameters:**
  - `path`: `string` - Remote file path to delete (e.g., `/var/www/deletethis.txt`).
- **Responses:**
  - `200 OK`: File deleted.
  - `404 Not Found`: File does not exist.

#### `POST /command`

- **Summary:** Run a shell command on the remote server.
- **Description:** Executes the specified shell command via SSH and returns its standard output and standard error.
- **Request Body:** `{ command: string }`
- **Responses:**
  - `200 OK`: Command executed successfully.
  - `500 Internal Server Error`: SSH connection or command execution failed.

#### `GET /download`

- **Summary:** Download a remote file.
- **Description:** Downloads a file from the remote server to the client. The file is first fetched to a local temporary path on the NestJS server, then streamed to the client, and finally deleted from the temp path.
- **Query Parameters:**
  - `remotePath`: `string` - Full remote file path to download (e.g., `/var/www/index.html`).
- **Responses:**
  - `200 OK`: Returns the downloaded file.
  - `404 Not Found`: File not found on remote server.
  - `500 Internal Server Error`: SSH or file operation failed.

### Private Helper: `loadSshConfig()`

This method loads the necessary SSH connection configuration (host, port, username, private key, passphrase) from environment variables. It ensures that the private key file exists before attempting a connection.

- **Throws:** `InternalServerErrorException` if `SSH_PRIVATE_KEY_PATH` is not configured or the file does not exist.
