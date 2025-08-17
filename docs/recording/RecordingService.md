## RecordingService

`RecordingService` encapsulates the core business logic for screen recording, screenshots, and managing recording data. It interacts with the file system to save media files, with external processes (like FFmpeg) for screen capture, and with the database to persist recording metadata.

### Dependencies

- `PrismaService`: For all database operations related to the `Recording` model.
- `TerminalService`: To execute system commands, specifically for gracefully stopping the FFmpeg recording process.
- `child_process`: Node.js built-in module for spawning `ffmpeg` and checking its installation.
- `screenshot-desktop`: A library for capturing screenshots.
- `fs/promises`: For asynchronous file system operations like reading directories, getting file stats, creating directories, writing files, and deleting files.
- `@nestjs/core` (`REQUEST`): To inject the `Request` object and access the authenticated user's ID (`userId`) for multi-tenant recording management.

### Properties

- `recordingProcess`: `ChildProcessWithoutNullStreams | null` - Holds the spawned FFmpeg process when recording is active.
- `stopTimer`: `NodeJS.Timeout | null` - A timer used to automatically stop recordings after a predefined duration (e.g., 2 hours).
- `currentRecordingFile`: `string | null` - The path to the file currently being recorded.
- `recordingStartTime`: `number | null` - Timestamp when the current recording started, used to calculate duration.
- `lastRecordingMetadata`: `Record<string, any> | null` - Stores additional metadata for the last recording.
- `startedAt`: `Date | null` - The exact `Date` object when recording started, primarily for `getRecordingStatus` response.
- `userId`: `string | undefined` - The ID of the currently authenticated user, used for user-specific file paths and database queries.

### Methods

#### `getRecordingStatus(id?: string): Promise<{ id: string; recording: boolean; file: string | null; startedAt: string | null }>`

Retrieves the current status of screen recording for the authenticated user or for a specific recording ID. It checks the database for an active 'recording' status or a specific record.

- **Parameters:**
  - `id`: `string` (optional) - Specific recording ID to check status for.
- **Returns:** An object indicating if recording is active, the file path, start time, and recording ID.
- **Throws:** `NotFoundException` if a specific `id` is provided but no matching recording is found.

#### `getMetadata(file: string): Promise<{ size: number; modified: string }>`

Retrieves the size and last modified date of a given recording file. It resolves the file path correctly based on whether it's an absolute path or just a filename.

- **Parameters:**
  - `file`: `string` - Full path or filename of the recording.
- **Returns:** An object with `size` (bytes) and `modified` (ISO string).

#### `listRecordings(): Promise<string[]>`

Lists all recorded files specific to the current user within their designated recordings directory.

- **Returns:** An array of full file paths.

#### `cleanupOld(days: number = 7): Promise<{ deleted: string[] }>`

Deletes recording files that are older than a specified number of `days` from the current user's recordings directory.

- **Parameters:**
  - `days`: `number` (optional, default: `7`) - The age threshold in days.
- **Returns:** An object containing an array of deleted file paths.

#### `create(data: CreateRecordingDto)`

Creates a new `Recording` entry in the database. Automatically links the record to the `createdBy` user based on the current authenticated `userId`.

- **Parameters:**
  - `data`: [`CreateRecordingDto`](./DTOs.md) - The data for the new recording entry.

#### `findAllPaginated(where?: Prisma.RecordingWhereInput, page?: number, pageSize?: number, select?: Prisma.RecordingSelect)`

Retrieves a paginated list of `Recording` entries from the database, filtered by the current user's ID by default.

- **Parameters:**
  - `where`: `Prisma.RecordingWhereInput` (optional) - Custom Prisma `where` clause.
  - `page`: `number` (optional, default: `1`)
  - `pageSize`: `number` (optional, default: `10`)
  - `select`: `Prisma.RecordingSelect` (optional) - Prisma `select` clause.

#### `findAll()`

Retrieves all `Recording` entries for the current authenticated user.

#### `findOne(id: string)`

Retrieves a single `Recording` entry by its ID.

- **Parameters:**
  - `id`: `string` - The ID of the recording.

#### `update(id: string, data: UpdateRecordingDto)`

Updates an existing `Recording` entry in the database.

- **Parameters:**
  - `id`: `string` - The ID of the recording to update.
  - `data`: [`UpdateRecordingDto`](./DTOs.md) - The data to update.

#### `remove(id: string): Promise<Recording>`

Deletes a `Recording` entry from the database and attempts to remove the associated physical file from disk. Logs warnings if file deletion fails.

- **Parameters:**
  - `id`: `string` - The ID of the recording to remove.
- **Throws:** `NotFoundException` if the recording is not found.

#### `captureScreen(): Promise<{ id: string; status: string; path: string }>`

Captures the current screen as a PNG image, saves it to a user-specific 'screenshots' directory, and creates a `Recording` entry with `type: 'screenShot'` and `status: 'finished'`.

- **Throws:** `BadRequestException` if `userId` is missing.

#### `startRecording(): Promise<StartRecordingResponseDto>`

Initiates a screen recording using FFmpeg. It checks for FFmpeg installation, determines platform-specific arguments, spawns the FFmpeg process, and creates a `Recording` entry with `status: 'recording'`. It also sets up an automatic stop timer (e.g., 2 hours) and handles process exit to update database status and gather final metadata (duration, file size).

- **Throws:**
  - `BadRequestException` if `userId` is missing.
  - `InternalServerErrorException` if FFmpeg is not installed or the recording process fails to start.

#### `stopRecording(id: string): Promise<{ id: string; status: string; path: string }>`

Stops an active screen recording by sending a `kill` signal to the FFmpeg process identified by its PID (stored in the database). Updates the `Recording` entry's `status` to 'finished' and adds `stoppedAt` timestamp to its data.

- **Parameters:**
  - `id`: `string` - The ID of the recording to stop.
- **Throws:** `BadRequestException` if the recording ID is not found or the process cannot be stopped.

#### `getFfmpegArgs(outputFile: string): string[]` (Private Helper)

Constructs the appropriate FFmpeg command-line arguments based on the operating system (macOS, Windows, Linux) to capture screen and audio. It uses environment variables for display and audio device settings on Linux.

- **Parameters:**
  - `outputFile`: `string` - The full path to the output MP4 file.
- **Returns:** An array of FFmpeg arguments.
