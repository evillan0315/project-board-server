## RecordingController

`RecordingController` manages all HTTP API endpoints for screen recording and screenshot functionalities. It provides endpoints for initiating, stopping, and managing recordings, as well as retrieving information about recorded files. Most administrative endpoints require `ADMIN` role authentication, while core capture/record functions are available to `USER` roles as well.

### Security

All endpoints in this controller are protected by `JwtAuthGuard` and `RolesGuard`, ensuring that only authenticated users with appropriate roles can access them. API documentation is enhanced with `ApiBearerAuth` annotations.

### Endpoints

All endpoints are prefixed with `/api/recording`.

#### `GET /status`

- **Summary:** Get current recording status.
- **Description:** Returns whether a recording is currently active, including the associated recording ID, file path, and start time. Can query status for a specific recording ID.
- **Query Parameters:**
  - `id` (optional): `string` - Recording ID to check (if not provided, checks for the current user's active recording).
- **Responses:**
  - `200 OK`: `object` - Example: `{ 'recording': true, 'file': '/path/to/file.mp4', 'startedAt': '2025-06-21T06:00:00.000Z', 'id': 'some-uuid' }`

#### `GET /metadata`

- **Summary:** Get metadata for a recording file.
- **Description:** Retrieves file size and last modification date for a specified recording file on disk.
- **Query Parameters:**
  - `file`: `string` (required) - Full path or filename of the recording.
- **Responses:**
  - `200 OK`: `object` - Example: `{ 'size': 1234567, 'modified': '2025-06-21T07:30:00.000Z' }`

#### `GET /list`

- **Summary:** List all saved recording files on disk.
- **Description:** Returns an array of full paths to all recording files stored in the designated recordings directory for the current user.
- **Responses:**
  - `200 OK`: `string[]` - Array of file paths.

#### `DELETE /recordings/cleanup`

- **Summary:** Delete recordings older than N days.
- **Description:** Removes recording files from disk that are older than the specified number of days. Defaults to 7 days if not provided.
- **Query Parameters:**
  - `days` (optional): `number` - Number of days to use as threshold (default: 7).
- **Responses:**
  - `200 OK`: `object` - Example: `{ 'deleted': ['path/to/old-recording.mp4'] }`

#### `POST /capture`

- **Summary:** Take a screenshot of the current screen.
- **Description:** Captures the current desktop screen and saves it as a PNG image. Records metadata in the database.
- **Roles:** `ADMIN`, `USER`
- **Responses:**
  - `200 OK`: `object` - Example: `{ 'id': 'uuid', 'status': 'finished', 'path': '/path/to/screenshot.png' }`

#### `POST /record-start`

- **Summary:** Start screen recording.
- **Description:** Initiates a new screen recording session using FFmpeg. A new recording entry is created in the database. Recordings have an automatic 2-hour stop limit.
- **Roles:** `ADMIN`, `USER`
- **Responses:**
  - `200 OK`: [`StartRecordingResponseDto`](./DTOs.md)
  - `400 Bad Request`: If FFmpeg is not installed or recording is already active.

#### `POST /record-stop`

- **Summary:** Stop screen recording.
- **Description:** Terminates the active screen recording identified by the provided ID. Updates the recording status in the database.
- **Query Parameters:**
  - `id`: `string` (required) - Recording ID to stop.
- **Responses:**
  - `200 OK`: `object` - Example: `{ 'id': 'uuid', 'status': 'finished', 'path': '/path/to/recorded-file.mp4' }`
  - `400 Bad Request`: If `id` is missing or recording not found/stopped.

#### `POST /`

- **Summary:** Create a new recording entry (Admin only).
- **Description:** Creates a new recording record in the database. This does not initiate a screen recording, but rather creates a database entry for a recording, which can be useful for manual logging or integration scenarios.
- **Roles:** `ADMIN`
- **Request Body:** [`CreateRecordingDto`](./DTOs.md)
- **Responses:**
  - `201 Created`: Successfully created.
  - `400 Bad Request`: Validation failed.

#### `GET /`

- **Summary:** Retrieve all recordings (Admin only).
- **Description:** Returns a list of all recording entries from the database.
- **Roles:** `ADMIN`
- **Responses:**
  - `200 OK`: `array<CreateRecordingDto>` - List of recordings.

#### `GET /paginated`

- **Summary:** Paginated recordings (Admin only).
- **Description:** Retrieves a paginated list of recording entries from the database.
- **Roles:** `ADMIN`
- **Query Parameters:** [`PaginationRecordingQueryDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: [`PaginationRecordingResultDto`](./DTOs.md) - Paginated results.

#### `GET /:id`

- **Summary:** Find recording by ID (Admin only).
- **Description:** Retrieves a single recording entry by its unique ID from the database.
- **Roles:** `ADMIN`
- **URL Parameters:**
  - `id`: `string` (required) - The unique ID of the recording.
- **Responses:**
  - `200 OK`: [`CreateRecordingDto`](./DTOs.md) - Recording found.
  - `404 Not Found`: Record not found.

#### `PATCH /:id`

- **Summary:** Update recording by ID (Admin only).
- **Description:** Updates an existing recording entry in the database based on its ID.
- **Roles:** `ADMIN`
- **URL Parameters:**
  - `id`: `string` (required) - The unique ID of the recording.
- **Request Body:** [`UpdateRecordingDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: Successfully updated.
  - `400 Bad Request`: Invalid data.
  - `404 Not Found`: Record not found.

#### `DELETE /:id`

- **Summary:** Delete recording by ID (Admin only).
- **Description:** Deletes a recording entry from the database and attempts to remove the associated file from disk.
- **Roles:** `ADMIN`
- **URL Parameters:**
  - `id`: `string` (required) - The unique ID of the recording.
- **Responses:**
  - `200 OK`: Successfully deleted.
  - `404 Not Found`: Record not found.
