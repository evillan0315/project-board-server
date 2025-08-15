## FileService

`FileService` provides the core business logic for interacting with the local file system, processing file content, handling file uploads/downloads, and performing advanced operations like project scanning for AI purposes. It enforces file validation rules and integrates with other services for language detection and module control.

### Dependencies

- `ModuleControlService`: To check if `FileModule` is enabled, restricting operations if disabled.
- `ConfigService`: To retrieve file validation limits (max size, allowed MIME types, extensions) and base directories.
- `UtilsService`: For utility functions like `detectLanguage` and `parseEnvMap`.
- `@nestjs/event-emitter` (`EventEmitter2`): For emitting progress/completion events during file streams.
- `fs/promises`, `fs-extra`: Node.js built-in and extended file system operations.
- `path`: For resolving and manipulating file paths.
- `mime-types`: For detecting file MIME types.
- `axios`: For fetching remote file content.
- `http`, `https`: For proxying external image URLs.

### Core Properties

- `BASE_DIR`: The root directory for file operations (from `process.env.BASE_DIR`).
- `maxFileSize`: Maximum allowed file size for uploads.
- `allowedMimeTypes`: List of permissible MIME types for uploads and external fetches.
- `allowedExtensions`: List of permissible file extensions.
- `RELEVANT_FILE_EXTENSIONS`, `EXCLUDE_DIR_NAMES_FOR_SCAN`, `EXCLUDE_FILE_NAMES_FOR_SCAN`, `RELEVANT_CONFIG_FILENAMES_FOR_SCAN`: Static sets used internally for the `scan` method's filtering logic.

### Methods

#### `onModuleInit()`

Lifecycle hook that logs a warning if `FileModule` is disabled via `ModuleControlService`.

#### `ensureFileModuleEnabled(): void`

Private helper that throws a `ForbiddenException` if `FileModule` is disabled.

#### `validateUploadedFile(file: Express.Multer.File): void`

Private helper that validates an uploaded file against configured `maxFileSize` and `allowedMimeTypes`.

#### `validateFileExtension(filePath: string): void`

Private helper that validates a file path's extension against `allowedExtensions`.

#### `resolveFile(file?: Express.Multer.File, body?: ReadFileDto): Promise<{ buffer: Buffer; filename: string; filePath: string }>`

Determines the source of file content (uploaded file, local path, or URL) and returns the file's buffer, filename, and original path/URL. Performs relevant validations.

- **Parameters:**
  - `file`: `Express.Multer.File` (optional) - An uploaded file object.
  - `body`: [`ReadFileDto`](./DTOs.md) (optional) - Contains `filePath` or `url`.
- **Throws:** `BadRequestException` if no source is provided or validation fails.

#### `getFileContent(filePath: string): Promise<string>`

Reads and returns the content of a local file as a UTF-8 string.

- **Parameters:**
  - `filePath`: `string` - The absolute or relative path to the file.
- **Throws:** `NotFoundException` if the file does not exist; `BadRequestException` if it's not a file; `InternalServerErrorException` on other read errors.

#### `getFileReadStream(filePath: string): Promise<Readable>`

Returns a Node.js `Readable` stream for a specified local file. Useful for direct streaming to clients.

- **Parameters:**
  - `filePath`: `string` - The path to the file.
- **Throws:** `BadRequestException`, `NotFoundException`, `InternalServerErrorException`.

#### `getFileReadStreamWithProgress(filePath: string, clientId: string, emitter: EventEmitter): Promise<Readable>`

Returns a `Readable` stream for a local file, emitting progress events (percentage read) to a specified client via an `EventEmitter`.

- **Parameters:**
  - `filePath`: `string` - The path to the file.
  - `clientId`: `string` - The ID of the client to send progress to.
  - `emitter`: `EventEmitter` - The event emitter instance (e.g., from `FileGateway`).
- **Emits Events:** `fileProgress`, `fileComplete`, `fileError`.

#### `getFilesByDirectory(directory?: string, recursive?: boolean): Promise<FileTreeNode[]>`

Lists files and folders within a given directory. Can perform a recursive scan. Excludes pre-defined system paths and user-configured excluded folders (`EXCLUDED_FOLDERS`).

- **Parameters:**
  - `directory`: `string` (optional, default `.`)
  - `recursive`: `boolean` (optional, default `false`)
- **Returns:** An array of `FileTreeNode` objects.
- **Throws:** `InternalServerErrorException` on directory read errors.

#### `scan(scanPaths: string[], projectRoot: string, verbose?: boolean): Promise<ScannedFileDto[]>`

Recursively scans specified paths (files or directories) within a project to find and read content from 'relevant' code files. It uses internal exclusion lists (`EXCLUDE_DIR_NAMES_FOR_SCAN`, `EXCLUDE_FILE_NAMES_FOR_SCAN`, `RELEVANT_FILE_EXTENSIONS`, `RELEVANT_CONFIG_FILENAMES_FOR_SCAN`) to focus on human-readable source code and configuration files, excluding common build artifacts, version control folders, etc. This is primarily used for building context for AI models.

- **Parameters:**
  - `scanPaths`: `string[]` - An array of absolute or relative paths to start scanning from.
  - `projectRoot`: `string` - The root directory of the project, used to calculate `relativePath`.
  - `verbose`: `boolean` (optional, default `false`) - If `true`, logs detailed scanning progress.
- **Returns:** An array of [`ScannedFileDto`](./DTOs.md) containing `filePath`, `relativePath`, and `content`.
- **Throws:** `InternalServerErrorException` on scan errors.

#### `readFile(buffer: Buffer, filename: string, generateBlobUrl?: boolean, filePath?: string): ReadFileResponseDto`

Converts a file buffer into a structured response, detecting MIME type and language. Can generate a base64 data URL if requested.

- **Parameters:**
  - `buffer`: `Buffer` - The file's binary content.
  - `filename`: `string` - The original filename.
  - `generateBlobUrl`: `boolean` (optional) - If `true`, returns a data URL.
  - `filePath`: `string` (optional) - The original path, if applicable.
- **Returns:** [`ReadFileResponseDto`](./DTOs.md).

#### `readMultipleFiles(files: { buffer: Buffer; filename: string; filePath?: string }[], generateBlobUrl?: boolean): Promise<ReadFileResponseDto[]>`

Processes an array of file buffers, applying the `readFile` logic to each.

- **Returns:** An array of [`ReadFileResponseDto`](./DTOs.md).

#### `proxyImage(url: string, res: Response): Promise<void>`

Fetches an image from a remote URL and pipes its content directly to the HTTP response, setting appropriate headers. Useful for bypassing client-side CORS issues.

- **Parameters:**
  - `url`: `string` - The URL of the image.
  - `res`: `Response` - The Express response object.
- **Throws:** `BadRequestException` for invalid URLs; `InternalServerErrorException` on fetch/stream errors.

#### `createLocalFileOrFolder(dto: CreateFileDto): Promise<{ success: boolean; filePath: string }>`

Creates a new file or folder at a specified path. Parent directories are created recursively.

- **Parameters:**
  - `dto`: [`CreateFileDto`](./DTOs.md)
- **Throws:** `InternalServerErrorException` on creation errors.

#### `writeLocalFileContent(filePath: string, content: string): Promise<{ success: boolean; message: string }>`

Writes provided content to a specified local file. Creates parent directories if they don't exist.

- **Throws:** `InternalServerErrorException` on write errors.

#### `deleteLocalFile(filePath: string): Promise<{ success: boolean; message: string }>`

Deletes a file or directory (recursively if it's a directory) at the specified path.

- **Throws:** `NotFoundException` if path doesn't exist; `InternalServerErrorException` on deletion errors.

#### `renameLocalFileOrFolder(oldPath: string, newPath: string): Promise<RenameFileResponseDto>`

Renames or moves a file or folder from `oldPath` to `newPath`.

- **Throws:** `NotFoundException` if `oldPath` doesn't exist; `BadRequestException` if `newPath` already exists; `InternalServerErrorException` on rename errors.

#### `searchFilesByName(directory: string, searchTerm: string): Promise<{ name: string; path: string; isDirectory: boolean; type: 'file' | 'folder'; }[]>`

Recursively searches for files and folders within a directory whose names contain the `searchTerm` (case-insensitive).

- **Throws:** `BadRequestException` if directory not found; `InternalServerErrorException` on search errors.
