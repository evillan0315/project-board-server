## Recording Module Data Transfer Objects (DTOs)

DTOs define the structure of data payloads for requests and responses within the Recording module. They are used for validation, clarity, and API documentation (Swagger).

### `CreateRecordingDto`

Used for creating a new recording entry in the database. Note that `createdById` is typically set by the backend automatically from the authenticated user.

- `path`: `string` (required) - Path to the recording file on the server.
- `type`: `string` (required) - Type of the recording (e.g., `'screenRecord'`, `'screenShot'`, `'audioRecord'`).
- `pid`: `string` (required) - Process ID related to the recording (e.g., the FFmpeg process ID).
- `status`: `string` (required) - Current status of the recording (e.g., `'recording'`, `'finished'`, `'ready'`, `'failed'`).
- `data`: `object` (required) - Structured JSON data for additional recording details (e.g., `startedAt`, `stoppedAt`, `duration`, `fileSize`).
- `createdById`: `string` (required) - ID of the user who created the recording.

### `RecordingResultDto`

Represents a single recording entry returned from the API, including its auto-generated `id` and `createdAt` timestamp.

- `id`: `string` (required) - Unique ID of the recording.
- `path`: `string` (required) - Path to the recording file.
- `type`: `string` (required) - Type of the recording.
- `pid`: `string` (required) - Process ID related to this recording.
- `status`: `string` (required) - Current status of the recording.
- `data`: `object` (required) - Structured recording data.
- `createdAt`: `string` (required) - ISO 8601 timestamp of when the recording entry was created.
- `createdById`: `string` (required) - ID of the user who created the recording.

### `PaginationRecordingResultDto`

Used for paginated lists of recording results.

- `items`: `RecordingResultDto[]` (required) - Array of `RecordingResultDto` objects for the current page.
- `total`: `number` (required) - Total number of recording entries available.
- `page`: `number` (required) - Current page number.
- `pageSize`: `number` (required) - Number of items per page.
- `totalPages`: `number` (required) - Total number of pages.

### `PaginationRecordingQueryDto`

Defines query parameters for paginated recording requests.

- `page`: `number` (optional, default: `1`) - Page number (starts at 1).
- `pageSize`: `number` (optional, default: `10`) - Number of items per page.
- `status`: `string` (optional) - Optional filter by recording status.
- `pid`: `string` (optional) - Optional filter by process ID.
- `type`: `string` (optional) - Optional filter by recording type.
- `createdById`: `string` (optional) - Optional filter by the ID of the user who created the recording.

### `StartRecordingResponseDto`

Response structure returned when a screen recording successfully starts.

- `path`: `string` (required) - Full path to the recording file being created.
- `id`: `string` (required) - The unique ID of the newly created recording entry in the database.

### `StartRecordingDto`

DTO for initiating a recording (though currently, startRecording does not take a body, this DTO exists).

- `name`: `string` (optional) - An optional name for the recording.
- `type`: `string` (required) - The type of recording (e.g., `'screenRecord'`, `'screenShot'`).

### `UpdateRecordingDto`

Used for updating an existing recording entry. It's a partial type of `CreateRecordingDto`, meaning all its properties are optional.

- Extends `PartialType(CreateRecordingDto)`.

### `StopRecordingResponse` (Internal Controller Class)

This is an internal class defined within the `RecordingController` for its response type. It represents the information returned when a recording or capture operation is stopped or completed.

- `id`: `string` (required) - The ID of the recording/capture entry.
- `status`: `string` (required) - The final status of the operation (e.g., `'finished'`, `'ready'`).
- `path`: `string` (required) - The path to the resulting file.
