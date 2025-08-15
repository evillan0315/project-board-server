## File Module Data Transfer Objects (DTOs)

DTOs define the structure of data payloads for requests and responses across the File & Folder Management module's HTTP and WebSocket APIs. They ensure data consistency, facilitate validation, and are used for Swagger API documentation.

### `ConvertFileDto`

Used for converting file content from a source to a specified format.

- `filePath`: `string` (optional) - System/local file path to read content from.
- `url`: `string` (optional) - URL of a remote file to fetch content from.
- `format`: [`FileFormat`](./Enums.md) (required) - Format to convert the file content to.

### `CreateFileDto`

Used for creating new files or directories.

- `filePath`: `string` (required) - Path to the file or directory.
- `isDirectory`: `boolean` (required, default: `false`) - Indicates if the path refers to a directory.
- `content`: `string` (optional) - Optional content for the file (ignored if `isDirectory` is `true`).
- `type`: `string` (optional, default: `'file'`) - Whether it is a folder or a file.

### `FileFormatDto`

Defines a target file format.

- `format`: [`FileFormat`](./Enums.md) (required) - The format to convert the file content to.

### `FileInputDto`

Similar to `ConvertFileDto`, specifies a file input source and a target format.

- `filePath`: `string` (optional) - System/local file path to read content from.
- `url`: `string` (optional) - URL of a remote file to fetch content from.
- `format`: [`FileFormat`](./Enums.md) (required) - Format to convert the file content to.

### `GenerateContentDto`

Used for requests to generate content (e.g., via an AI model).

- `content`: `string` (required) - Content prompt to generate output from.
- `type`: `string` (required) - Type of content to generate (e.g., `html`, `json`, `markdown`, `documentation`, `tutorial`).
- `topic`: `string` (optional) - Type of topic to generate (e.g., `NestJS`, `React`, `AWS`).
- `chatId`: `string` (optional) - Chat identifier.

### `ReadFileResponseDto`

Structure of the response when reading file content.

- `filePath`: `string` (optional, nullable) - Absolute or relative path to the file on the server (for local files).
- `filename`: `string` (required) - The original filename (e.g., `document.pdf`, `index.ts`).
- `mimeType`: `string` (required) - The MIME type of the file (e.g., `text/plain`, `application/json`).
- `language`: `string` (optional, nullable) - Detected programming language (e.g., `typescript`, `json`).
- `content`: `string` (required) - The content of the file (raw text for text files, base64 for binary).
- `blob`: `string` (optional, nullable) - A base64 encoded data URL (blob) of the file, if requested.

### `ReadFileDto`

Used for requests to read file content from various sources.

- `filePath`: `string` (optional) - Path to a file on the system.
- `url`: `string` (optional) - URL of a file to fetch.
- `generateBlobUrl`: `boolean` (optional) - If `true`, returns a base64 URL Blob instead of plain text.

### `ReadMultipleFilesDto`

Used for requests to read content from multiple uploaded files.

- `generateBlobUrl`: `boolean` (optional) - If `true`, returns base64 blob-style data URLs for each file.
- `context`: `string` (optional) - Optional context information.

### `RenameFileDto`

Used for renaming files or folders.

- `oldPath`: `string` (required) - The current path of the file or folder to rename.
- `newPath`: `string` (required) - The new desired path (including the new name).

### `RenameFileResponseDto`

Response structure for a rename operation.

- `success`: `boolean` (required) - Indicates if the operation was successful.
- `message`: `string` (required) - A descriptive message.
- `oldPath`: `string` (required) - The original path.
- `newPath`: `string` (required) - The new path.

### `ScanFileDto`

Used for requests to scan project directories for relevant code files.

- `scanPaths`: `string[]` (optional, default: `['.']`) - An array of paths to scan (directories or files).
- `projectRoot`: `string` (optional, default: `process.cwd()`) - The root directory of the project.
- `verbose`: `boolean` (optional, default: `false`) - If `true`, logs detailed information during scanning.

### `ScannedFileDto`

Represents a file found during a project scan.

- `filePath`: `string` (required) - Absolute path of the file.
- `relativePath`: `string` (required) - Path relative to the project root.
- `content`: `string` (required) - Content of the file.

### `SearchFileResponseDto`

Represents a single result from a file search.

- `name`: `string` (required) - Name of the file or folder.
- `path`: `string` (required) - Full path of the file or folder.
- `isDirectory`: `boolean` (required) - Indicates if the item is a directory.
- `type`: `'file' | 'folder'` (required) - Type of the item.

### `SearchFileDto`

Used for requests to search files and folders by name.

- `directory`: `string` (optional, default: current working directory) - The root directory to start the search.
- `searchTerm`: `string` (required) - The name or part of the name to search for.

### `UpdateFileDto`

Used for updating existing files. It's a partial type of `CreateFileDto`, meaning all its properties are optional.

- Extends `PartialType(CreateFileDto)`.

### `RemoteFileContentDto`

Used for sending content to remote files.

- `content`: `string` (required) - Content to write to the file.

### `RemoteFileEntryDto`

Represents a file listed from a remote server.

- `path`: `string` (required) - Relative path of the file.
- `size`: `number` (required) - Size of the file in bytes.
- `modifiedTime`: `Date | null` (required, nullable) - Last modified time of the file.

### `RemoteDirectoryEntryDto`

Represents a directory listed from a remote server.

- `path`: `string` (required) - Relative path of the directory.

### `RemoteFileListDto`

Response structure for listing remote files and directories.

- `files`: `RemoteFileEntryDto[]` (required) - List of files with metadata.
- `directories`: `RemoteDirectoryEntryDto[]` (required) - List of directories.

### `PaginationFileQueryDto`

Used for pagination queries for file listings (though not directly used in core file operations provided).

- `page`: `number` (optional, default: `1`)
- `pageSize`: `number` (optional, default: `10`)

### `PaginationFileResultDto`

Used for pagination results for file listings.

- `items`: `CreateFileDto[]` (required) - Array of file items.
- `total`: `number` (required) - Total number of items.
- `page`: `number` (required) - Current page number.
- `pageSize`: `number` (required) - Page size.
- `totalPages`: `number` (required) - Total number of pages.
