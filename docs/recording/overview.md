## Recording Module Overview

The Recording module provides robust functionalities for screen capture, including taking screenshots and recording screen video, along with comprehensive management of the recorded files. It integrates with native system utilities (like FFmpeg) to perform these operations and stores metadata about the recordings in the database.

### Key Features

- **Screen Recording:** Start and stop video recordings of the desktop screen.
- **Screenshots:** Capture static images of the current screen.
- **Recording Status:** Check the status of ongoing recordings, including the file path and start time.
- **File Metadata:** Retrieve size and last modification time for recorded files.
- **File Listing:** List all saved screenshots and video recordings on disk.
- **Automated Cleanup:** Delete old recordings based on a configurable age threshold.
- **Database Integration:** Persist recording metadata (path, type, status, associated user) in the application database.

### Core Components

- [`RecordingController`](./RecordingController.md): Handles all HTTP API endpoints related to screen recording and screenshot functionalities.
- [`RecordingService`](./RecordingService.md): Contains the core business logic for initiating/stopping recordings, capturing screenshots, interacting with the file system, and managing recording data in the database.
- [`DTOs`](./DTOs.md): Data Transfer Objects for requests and responses within the recording module.

### Dependencies

The module relies on the following key dependencies:

- **FFmpeg:** An external command-line tool required for screen recording and capturing. It must be installed and accessible in the system's PATH.
- `screenshot-desktop`: A Node.js library for taking screenshots.
- `child_process`: Node.js built-in module for spawning external processes (like FFmpeg).
- `fs/promises`: Node.js built-in module for asynchronous file system operations.
- `PrismaService`: For database interactions with the `Recording` model.
- `TerminalService`: Used for stopping recording processes by killing their PIDs.
