## FileController

`FileController` manages HTTP API endpoints for various local file and folder operations. It handles file content manipulation, directory listing, media streaming, and project scanning, with most endpoints requiring `ADMIN` role authentication.

### Endpoints

All endpoints are prefixed with `/api/file` and generally require `JwtAuthGuard` and `RolesGuard` with `ADMIN` role.

#### `POST /open`

- **Summary:** Open a file and return its content.
- **Description:** Reads the content of a specified local file and returns it as a string.
- **Roles:** `ADMIN`
- **Request Body:** `{ filePath: string }`
- **Responses:**
  - `200 OK`: File content returned.
  - `400 Bad Request`: `filePath` is missing or invalid.
  - `404 Not Found`: File not found or path is not a file.
  - `500 Internal Server Error`: Failed to open file.

#### `POST /close`

- **Summary:** Acknowledge file close request.
- **Description:** A simple endpoint to acknowledge that a file is being closed. Primarily used for notification/logging.
- **Roles:** `ADMIN`
- **Request Body:** `{ filePath: string }`
- **Responses:**
  - `200 OK`: File close acknowledged.
  - `400 Bad Request`: `filePath` is missing.

#### `GET /list`

- **Summary:** List files and folders in a directory.
- **Description:** Recursively lists the contents of a specified local directory. Excludes certain system and user-defined folders.
- **Roles:** `ADMIN`
- **Query Parameters:**
  - `directory` (optional): `string` - Path to the directory (defaults to current working directory).
  - `recursive` (optional): `boolean` - List files recursively (defaults to `false`).
- **Responses:**
  - `200 OK`: List of files and directories.
  - `400 Bad Request`: Invalid directory path.
  - `500 Internal Server Error`: Failed to list directory contents.

#### `GET /stream`

- **Summary:** Stream media file with HTTP range support.
- **Description:** Streams a media file (e.g., audio, video) from the local file system. Supports HTTP `Range` headers for partial content requests (e.g., seeking in a video).
- **Roles:** All authenticated users (no explicit `@Roles` decorator, but `JwtAuthGuard` is active on controller).
- **Query Parameters:**
  - `filePath`: `string` (required) - Absolute or relative path to the media file.
- **Responses:**
  - `206 Partial Content` (for range requests) or `200 OK`: Streams the media file.
  - `400 Bad Request`: `filePath` missing or invalid.
  - `404 Not Found`: File not found or not a file.
  - `500 Internal Server Error`: Failed to stream file.

#### `GET /download`

- **Summary:** Stream a file directly to the client for download.
- **Description:** Provides a direct file download by streaming its content to the client. Sets appropriate `Content-Disposition` and `Content-Type` headers.
- **Roles:** `ADMIN`
- **Query Parameters:**
  - `filePath`: `string` (required) - Absolute or relative path to the file.
- **Responses:**
  - `200 OK`: File streamed successfully.
  - `400 Bad Request`: `filePath` missing or invalid.
  - `404 Not Found`: File not found or not a file.
  - `500 Internal Server Error`: Failed to stream file.

#### `POST /read`

- **Summary:** Read file content from an uploaded file, local path, or URL.
- **Description:** A versatile endpoint to obtain file content from multiple sources. Can return content as plain text or a base64 data URL.
- **Roles:** `ADMIN`
- **Request Body (multipart/form-data):**
  - `file`: `binary` (optional) - An uploaded file.
  - `filePath`: `string` (optional) - A local file system path.
  - `url`: `string` (optional) - A URL to a remote file.
  - `generateBlobUrl`: `boolean` (optional) - If `true`, returns content as a base64 blob-style data URL.
- **Interceptors:** `FileInterceptor('file')`
- **Responses:**
  - `200 OK`: [`ReadFileResponseDto`](./DTOs.md) - File content and metadata.
  - `400 Bad Request`: No file, path, or URL provided; validation failed.
  - `404 Not Found`: Requested file for streaming not found.

#### `POST /read-many`

- **Summary:** Upload and read content from multiple files.
- **Description:** Allows uploading multiple files and returns their contents and metadata.
- **Roles:** `ADMIN`
- **Request Body (multipart/form-data):**
  - `files`: `array<binary>` (required) - Multiple files to upload.
  - `generateBlobUrl`: `boolean` (optional) - If `true`, returns content as base64 data URLs.
- **Interceptors:** `FilesInterceptor('files')`
- **Responses:**
  - `200 OK`: `array<ReadFileResponseDto>` - Contents of multiple files.
  - `400 Bad Request`: No files uploaded or validation failed.

#### `GET /proxy`

- **Summary:** Proxies an image URL and streams the image content.
- **Description:** Fetches an image from a given URL and streams it back to the client, useful for bypassing CORS issues or hiding original image sources.
- **Roles:** All authenticated users.
- **Query Parameters:**
  - `url`: `string` (required) - The URL of the image to proxy.
- **Responses:**
  - `200 OK`: Image successfully proxied.
  - `400 Bad Request`: Missing or invalid image URL.
  - `500 Internal Server Error`: Error fetching or streaming image.

#### `POST /create`

- **Summary:** Create a new file or folder.
- **Description:** Creates a new file (with optional content) or an empty folder at the specified path. Parent directories are created recursively if they don't exist.
- **Roles:** `ADMIN`
- **Request Body:** [`CreateFileDto`](./DTOs.md)
- **Responses:**
  - `201 Created`: File or folder created.
  - `400 Bad Request`: Invalid input or path.

#### `POST /create-folder`

- **Summary:** Create a new folder.
- **Description:** A specialized endpoint for creating only folders. Equivalent to calling `/create` with `isDirectory: true`.
- **Roles:** `ADMIN`
- **Request Body:** [`CreateFileDto`](./DTOs.md) (with `isDirectory` set to `true`)
- **Responses:**
  - `201 Created`: Folder created.
  - `400 Bad Request`: Invalid input or path.

#### `POST /write`

- **Summary:** Write content to a file at a specified path.
- **Description:** Creates a new file or overwrites an existing one with the provided content. Parent directories are created if necessary.
- **Roles:** `ADMIN`
- **Request Body:** [`UpdateFileDto`](./DTOs.md) (specifically `filePath` and `content`)
- **Responses:**
  - `200 OK`: File written successfully.
  - `400 Bad Request`: `filePath` or `content` missing.
  - `500 Internal Server Error`: Failed to write file.

#### `POST /delete`

- **Summary:** Delete a file or folder.
- **Description:** Deletes a file or an empty/non-empty folder at the specified path.
- **Roles:** `ADMIN`
- **Request Body:** `{ filePath: string }`
- **Responses:**
  - `200 OK`: Successfully deleted.
  - `400 Bad Request`: Path not found or invalid.
  - `500 Internal Server Error`: Failed to delete.

#### `POST /rename`

- **Summary:** Rename a file or folder.
- **Description:** Moves and/or renames a file or folder from `oldPath` to `newPath`.
- **Roles:** `ADMIN`
- **Request Body:** [`RenameFileDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: Renamed successfully.
  - `400 Bad Request`: Invalid input or target already exists.
  - `404 Not Found`: Source path does not exist.
  - `500 Internal Server Error`: Failed to rename.

#### `POST /search`

- **Summary:** Search files and folders by name recursively.
- **Description:** Searches for files and folders whose names match the `searchTerm` within a specified directory (recursively).
- **Roles:** `ADMIN`
- **Request Body:** [`SearchFileDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: Matching files/folders returned.
  - `400 Bad Request`: Invalid input or directory not found.
  - `500 Internal Server Error`: Failed to complete search.

#### `POST /upload`

- **Summary:** Upload a single file.
- **Description:** Uploads a single file and returns its content and metadata.
- **Roles:** All authenticated users.
- **Request Body (multipart/form-data):**
  - `file`: `binary` (required) - The file to upload.
- **Interceptors:** `FileInterceptor('file')`
- **Responses:**
  - `201 Created`: File uploaded successfully.

#### `POST /upload-multiple`

- **Summary:** Upload multiple files.
- **Description:** Uploads multiple files and returns their contents and metadata.
- **Roles:** All authenticated users.
- **Request Body (multipart/form-data):**
  - `files`: `array<binary>` (required) - The files to upload.
- **Interceptors:** `FilesInterceptor('files')`
- **Responses:**
  - `201 Created`: Files uploaded successfully.

#### `POST /scan`

- **Summary:** Scans specified directories and files for relevant code files.
- **Description:** Recursively scans paths (defaults to current working directory) for code-related files, reads their content, and returns absolute path, relative path, and content. Uses internal exclusion lists for common development artifacts (e.g., `node_modules`). Designed for AI context building.
- **Roles:** `ADMIN`
- **Request Body:** [`ScanFileDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: List of scanned files returned.
  - `500 Internal Server Error`: Failed to perform project scan.
