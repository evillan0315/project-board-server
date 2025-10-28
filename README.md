# Full-Stack Developer Toolkit & Utilities Server

A comprehensive backend application built with **NestJS**, providing robust authentication, extensive file and folder management (local and remote), powerful AI-powered code and content generation (Google Gemini), a suite of developer utilities, and screen recording capabilities. Designed for rapid development and enhanced productivity.

---

![Full-Stack Developer Toolkit Demo](/media/eddie/Data/projects/nestJS/nest-modules/full-stack/downloads/recordings/550acedf-2d16-4d84-9abf-2171840930ac/recorded-1755262332872_1756208611532.gif)

## Key Features

### JWT-based authentication via HTTP-only cookies and optional Bearer header

✅ User registration and login with `bcrypt` password hashing  
✅ Email verification flow (on registration, resend, and token verification)  
✅ OAuth2 login support for Google and GitHub  
✅ Role-based access control (RBAC) with `@Roles()` decorator and guard  
✅ Swagger API documentation for all endpoints

### File & Folder Management

- ✅ **Local File Operations:** Read, write, create, delete, rename, search, list files and folders.
- ✅ **Media Streaming:** Stream audio/video files with HTTP range support.
- ✅ **File Downloads:** Directly download files to the client.
- ✅ **Content Resolution:** Read file content from uploaded files, local paths, or URLs.
- ✅ **Multiple File Operations:** Upload and read content from multiple files.
- ✅ **Project Scanning:** Recursively scan directories for relevant code files, useful for AI context building (with intelligent exclusion lists).
- ✅ **Video Thumbnail Generation:** Automatically generate thumbnails for video files upon extraction from URLs or local scanning.
- ✅ **Real-time Collaboration (WebSockets):** Open, close, update, create, and delete files with real-time notifications for collaborative editing.
- ✅ **Remote File Management (SSH/SFTP):**
  - List files and directories on remote servers.
  - Create, update, and delete remote files.
  - Download files from remote servers.
  - Execute shell commands on remote servers.
- ✅ **GitHub Repository Management:** Create, commit, delete, list, and view contents of GitHub repositories.
- ✅ **Media Library Integration:** Automatically link scanned or extracted audio/video files to existing `Song` or `Video` entities in the media library, or create new ones if they don't exist, enriching the media collection.

### Generative AI (Google Gemini & Translator)

- ✅ **Text Generation:** General purpose text generation from prompts.
- ✅ **Image Captioning:** Generate descriptions for images from URLs or local files.
- ✅ **Text-to-Speech (TTS):** Convert text to natural-sounding speech audio (single and multi-speaker).
- ✅ **Code Generation:** Generate code snippets based on natural language instructions.
- ✅ **Code Documentation:** Generate documentation for code snippets (e.g., JSDoc, Markdown).
- ✅ **Code Optimization:** Improve code for performance and readability.
- ✅ **Code Analysis:** Identify issues, improvements, and best practices in code.
- ✅ **Code Repair:** Fix syntax or logical errors in code.
- ✅ **File Content Analysis:** Analyze content from uploaded files (e.g., SQL schemas, text documents).
- ✅ **Video Generation:** Generate videos from text prompts using the Veo model.
- ✅ **Live Conversational AI:** Real-time, streaming interactions with Gemini models for dynamic dialogue.
- ✅ **Text Translation:** Translate text or file content to various languages using Google Cloud Translation API.
- ✅ **Resume Tools:**
  - Generate new resumes based on detailed prompts.
  - Optimize existing resumes against job descriptions.
  - Enhance specific resume sections for impact.

### Developer Utilities

- ✅ **Image Conversion:** Convert images (PNG, JPG) to SVG (Vector graphics).
- ✅ **Code Formatting:** Format source code using Prettier (supports various languages).
- ✅ **JSDoc to Markdown:** Generate Markdown documentation directly from JSDoc comments in TypeScript/TSX files.
- ✅ **Markdown Conversions:**
  - Convert Markdown to plain text.
  - Convert Markdown to HTML (with global CSS styling).
  - Convert Markdown to JSON AST (Abstract Syntax Tree).
  - Convert Markdown to DOCX (Microsoft Word Document).
- ✅ **HTML to DOCX:** Convert HTML content to a DOCX document.
- ✅ **SQL Utilities:** Parse `SELECT` and `INSERT` statements to JSON, and generate `INSERT` SQL from JSON.
- ✅ **String Utilities:** Capitalize, kebab-case, reverse, truncate text, unique array filter, time ago formatting, Unix timestamp conversion.
- ✅ **Environment Variable Handling:** Convert `.env` files to JSON and JSON objects to `.env` strings.
- ✅ **JSON/YAML Conversion:** Bidirectional conversion between JSON objects and YAML strings.
- ✅ **Encoding/Decoding:** Base64 and URL encoding/decoding.
- ✅ **Code Highlighting:** Syntax highlighting for various programming languages.
- ✅ **ESLint Integration:** Lint code strings and retrieve detailed diagnostics (errors, warnings, fixes).
- ✅ **Code Transpilation:** Transpile JavaScript/TypeScript, React JSX, SolidJS JSX using ESBuild, supporting single files, multiple files, and ZIP archives.
- ✅ **Interactive Terminal & Remote Shell:** Execute local terminal commands and establish persistent SSH sessions to remote servers with real-time input/output (via WebSockets), **including command history persistence and session logging.**

### Screen Recording & Screenshots

| Method   | Endpoint                            | Description                               |
| -------- | ----------------------------------- | ----------------------------------------- |
| `GET`    | `/api/recording/status`             | Get current recording status              |
| `GET`    | `/api/recording/metadata`           | Get metadata for a recording file         |
| `GET`    | `/api/recording/list`               | List all saved recording files            |
| `DELETE` | `/api/recording/recordings/cleanup` | Delete recordings older than N days       |
| `POST`   | `/api/recording/capture`            | Take a screenshot of the screen           |
| `POST`   | `/api/recording/record-start`       | Start screen recording                    |
| `POST`   | `/api/recording/record-stop`        | Stop screen recording                     |
| `POST`   | `/api/llm-playwright/start-recording` | Start screen recording of a URL (via Playwright). Recording runs until `stop-recording` is called. |
| `POST`   | `/api/llm-playwright/stop-recording`  | Stop active screen recording (via Playwright) |
| `POST`   | `/api/recording`                    | Create a new recording entry (Admin only) |
| `GET`    | `/api/recording`                    | Retrieve all recordings (Admin only)      |
| `GET`    | `/api/recording/paginated`          | Paginated recordings (Admin only)         |
| `GET`    | `/api/recording/:id`                | Find recording by ID (Admin only)         |
| `PATCH`  | `/api/recording/:id`                | Update recording by ID (Admin only)       |
| `DELETE` | `/api/recording/:id`                | Delete recording by ID (Admin only)       |

---

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/evillan0315/project-board-server.git
cd project-board-server
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL='postgresql://...' # Your PostgreSQL database connection string
JWT_SECRET='your_jwt_secret' # Secret for JWT token signing

# OpenVidu Configuration
OPENVIDU_URL='https://viduk.swinglifestyle.com/openvidu' # Your OpenVidu Server URL
OPENVIDU_SECRET='MY_SECRET' # Your OpenVidu Secret (usually 'MY_SECRET' by default)

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID='your_google_client_id'
GOOGLE_CLIENT_SECRET='your_google_client_secret'
GOOGLE_CALLBACK_URL='http://localhost:3000/api/auth/google/callback'

# GitHub OAuth2 Credentials
GITHUB_CLIENT_ID='your_github_client_id'
GITHUB_CLIENT_SECRET='your_github_client_secret'
GITHUB_CALLBACK_URL='http://localhost:3000/api/auth/github/callback'

# Google Gemini AI Credentials
GOOGLE_GEMINI_API_KEY='your_gemini_api_key' # API Key for Google Gemini
GOOGLE_GEMINI_MODEL='gemini-1.5-flash' # e.g., gemini-pro, gemini-1.5-flash, gemini-1.5-pro
GOOGLE_GEMINI_LIVE_MODEL='gemini-live-2.5-flash-preview' # Specific model for live audio interactions

# Google Cloud Translation API Key
GOOGLE_TRANSLATION_API_KEY='your_translation_api_key' # NEW: API Key for Google Cloud Translation

# Base URL for API (for email verification links, etc.)
BASE_URL='http://localhost:3000'
BACKEND_URL='http://localhost:3000'
FRONTEND_URL='http://localhost:3001' # Your frontend URL for OAuth redirects and proxy CORS/CSP

# Proxy Service Configuration
# ALLOWED_PROXY_DOMAINS: Comma-separated list of hostnames/domains the proxy is allowed to fetch content from.
# Example: ALLOWED_PROXY_DOMAINS='example.com,api.anotherservice.net'
# If empty, proxying to any external URL is permitted, but a warning will be logged (DANGEROUS IN PROD).
ALLOWED_PROXY_DOMAINS=''

# SSH Config for Remote File Operations (Update with your server details)
SSH_HOST='your_remote_server_ip_or_hostname'
SSH_PORT=22
SSH_USERNAME='your_ssh_username'
SSH_PRIVATE_KEY_PATH='/path/to/your/ssh/private_key' # e.g., ~/.ssh/id_rsa
SSH_PASSPHRASE='your_private_key_passphrase' # Optional, if your key is encrypted

# Base Directory for Local File Operations (optional, defaults to CWD)
BASE_DIR='/path/to/your/project_root'

# Playwright Configuration
PLAYWRIGHT_BROWSER_TYPE='chromium' # e.g., chromium, firefox, webkit
PLAYWRIGHT_HEADLESS='true' # true or false
PLAYWRIGHT_TIMEOUT_MS='30000' # Default timeout in milliseconds for Playwright page actions (e.g., navigation, selector waits).
```

### 3. Generate Prisma Client and Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Install External System Dependencies (if needed)

-   **FFmpeg:** Required for screen recording, screenshots, **and video thumbnail generation**. [Download & Install FFmpeg](https://ffmpeg.org/download.html)
-   **Pandoc:** Required for converting Markdown/HTML to DOCX. [Download & Install Pandoc](https://pandoc.org/installing.html)
-   **ffprobe-client (npm package):** Required for extracting metadata (e.g., duration) from scanned local media files.

### 5. Run the Application

```bash
pnpm run start:dev
```

### 6. Access Swagger API Documentation

Visit [http://localhost:3000/api](http://localhost:3000/api) for the full interactive Swagger UI documentation, detailing all available endpoints and their usage.

---

## API Workflows

### Authentication & User Management

| Method | Endpoint                           | Description                    |
| ------ | ---------------------------------- | ------------------------------ |
| `POST` | `/api/auth/register`               | Register a new user            |
| `GET`  | `/api/auth/verify-email?token=...` | Verify user email              |
| `POST` | `/api/auth/login`                  | Log in a user                  |
| `POST` | `/api/auth/logout`                 | Log out user (clear cookie)    |
| `GET`  | `/api/auth/google`                 | Initiate Google OAuth2 login   |
| `GET`  | `/api/auth/github`                 | Initiate GitHub OAuth2 login   |
| `GET`  | `/api/auth/me`                     | Get current authenticated user |

### OpenVidu Management

| Method   | Endpoint                | Description                                         |
| -------- | ----------------------- | --------------------------------------------------- |
| `POST`   | `/api/openvidu/sessions`| Create a new OpenVidu session.                    |
| `POST`   | `/api/openvidu/tokens`  | Generate a token for a user to connect to a session. |
| `DELETE` | `/api/openvidu/sessions/:sessionId` | Delete an OpenVidu session.                       |
| `GET`    | `/api/openvidu/sessions`| Get a list of all active OpenVidu session IDs.    |

### File & Folder Management

| Method   | Endpoint                    | Description                                        |
| -------- | --------------------------- | -------------------------------------------------- |
| `GET`    | `/api/file/list`            | List contents of a directory                       |
| `POST`   | `/api/file/read`            | Read content of a file (upload, path, URL)         |
| `POST`   | `/api/file/create`          | Create a new file or folder                        |
| `POST`   | `/api/file/delete`          | Delete a file or folder                            |
| `POST`   | `/api/file/rename`          | Rename a file or folder                            |
| `POST`   | `/api/file/scan`            | Scan project directories for relevant files        |
| `GET`    | `/api/file/stream`          | Stream media files with range support              |
| `GET`    | `/api/file/download`        | Stream a file directly to the client for download  |
| `GET`    | `/api/proxy`                | Proxies an image URL and streams the image content |
| `POST`   | `/api/file/write`           | Write content to a file                            |
| `POST`   | `/api/file/upload`          | Upload a single file                               |
| `POST`   | `/api/file/upload-multiple` | Upload multiple files                              |
| `GET`    | `/api/remote/list`          | List files on a remote server (SSH/SFTP)           |
| `POST`   | `/api/remote/file`          | Create a new file on remote server                 |
| `PUT`    | `/api/remote/file`          | Update an existing file on remote server           |
| `DELETE` | `/api/remote/file`          | Delete a file on remote server                     |
| `POST`   | `/api/remote/command`       | Run a shell command on the remote server           |
| `GET`    | `/api/remote/download`      | Download a remote file                             |
| `GET`    | `/repos`                    | Get all repositories from GitHub                   |
| `GET`    | `/repos/:repoName`          | Get a single repository by name                    |
| `POST`   | `/repos`                    | Create a new GitHub repository                     |
| `PATCH`  | `/repos/:repoName/commit`   | Simulate a commit to a repository                  |
| `DELETE` | `/repos/:repoName`          | Delete a GitHub repository                         |
| `GET`    | `/repos/:repoName/contents` | Get repository files and directory contents        |

### Database Management

| Method   | Endpoint                     | Description                                        |
| -------- | ---------------------------- | -------------------------------------------------- |
| `GET`    | `/api/database/tables`       | List all tables/collections with column metadata   |
| `GET`    | `/api/database/columns`      | Get column details for a specific table            |
| `POST`   | `/api/database/create-table` | Create a new table or collection                   |
| `DELETE` | `/api/database/drop-table`   | **Drop a table or collection**                     |
| `POST`   | `/api/database/execute`      | Execute raw SQL queries                            |

### Generative AI (Google Gemini & Translator)

| Method | Endpoint                               | Description                             |
| ------ | -------------------------------------- | --------------------------------------- |
| `POST` | `/api/google-gemini/generate-doc`      | Generate documentation from code        |
| `POST` | `/api/google-gemini/generate-code`     | Generate code snippets                  |
| `POST` | `/api/google-gemini-image/caption-url` | Caption image from URL                  |
| `POST` | `/api/google-tts/generate`             | Generate speech from text (TTS)         |
| `POST` | `/api/gemini/file/generate-text`       | General text generation                 |
| `POST` | `/api/gemini/file/generate-file`       | Analyze uploaded file content           |
| `POST` | `/api/gemini/file/generate-resume`     | Generate a new resume                   |
| `POST` | `/api/gemini/file/optimize-resume`     | Optimize resume against job description |
| `POST` | `/api/gemini/file/enhance-resume`      | Enhance specific resume sections        |
| `POST` | `/api/gemini/file/generate-video`      | Generate a video from a text prompt     |
| `POST` | `/api/google-translator/translate`     | Translate text or file content          |

### LLM Operations

| Method | Endpoint                             | Description                                            |
| ------ | ------------------------------------ | ------------------------------------------------------ |
| `POST` | `/api/llm/generate-llm`              | Generate code/content and proposed file changes        |
| `POST` | `/api/llm/report-error`              | Report an error to the LLM for analysis and fix suggestions |
| `GET`  | `/api/llm/project-structure`         | Generate project structure (directory tree)            |
| `POST` | `/api/llm-playwright/perform-tasks`  | Orchestrate Playwright tasks with optional LLM analysis. If recording is enabled, it stops at task completion. |
| `POST` | `/api/llm-playwright/start-recording` | Start screen recording of a URL (via Playwright). Recording runs until `stop-recording` is called. |
| `POST` | `/api/llm-playwright/stop-recording`  | Stop active screen recording (via Playwright) |

### Conversation Management

| Method | Endpoint                         | Description                                      |
| ------ | -------------------------------- | ------------------------------------------------ |
| `GET`  | `/api/conversations`             | Get paginated list of conversation summaries     |
| `GET`  | `/api/conversations/:id/history` | Get paginated history of a specific conversation |

### Developer Utilities & Shell

| Method | Endpoint                       | Description                             |
| ------ | ------------------------------ | --------------------------------------- |
| `POST` | `/api/terminal/run`            | Execute a local terminal command        |
| `POST` | `/api/terminal/ssh/run`        | Execute an SSH command on remote server |
| `POST` | `/eslint/lint`                 | Lint a given code string using ESLint   |
| `POST` | `/api/transpile`               | Transpile raw code string               |
| `POST` | `/api/transpile/file`          | Transpile an uploaded file              |
| `POST` | `/api/transpile/files`         | Transpile multiple uploaded files       |
| `POST` | `/api/transpile/directory`     | Transpile files from a ZIP archive      |
| `POST` | `/api/utils/format-code`       | Format source code with Prettier        |
| `POST` | `/api/utils/json-to-env`       | Convert JSON to `.env` format           |
| `POST` | `/api/utils/env-to-json`       | Convert `.env` to JSON format           |
| `POST` | `/api/utils/markdown-to-html`  | Convert Markdown to HTML                |
| `POST` | `/api/utils/markdown-to-docx`  | Convert Markdown to DOCX                |
| `POST` | `/api/utils/html-to-docx`      | Convert HTML to DOCX                    |
| `POST` | `/api/utils/convert-to-svg`    | Convert image (PNG/JPG) to SVG          |
| `GET`  | `/api/docs/generate`           | Generate Markdown from JSDoc            |
| `POST` | `/api/utils/json-yaml/to-yaml` | Convert JSON to YAML                    |
| `POST` | `/api/encoding/base64/encode`  | Encode text to Base64                   |

### Screen Recording & Screenshots

| Method   | Endpoint                            | Description                               |
| -------- | ----------------------------------- | ----------------------------------------- |
| `GET`    | `/api/recording/status`             | Get current recording status              |
| `GET`    | `/api/recording/metadata`           | Get metadata for a recording file         |
| `GET`    | `/api/recording/list`               | List all saved recordings                 |
| `DELETE` | `/api/recording/recordings/cleanup` | Delete recordings older than N days       |
| `POST`   | `/api/recording/capture`            | Take a screenshot of the screen           |
| `POST`   | `/api/recording/record-start`       | Start screen recording                    |
| `POST`   | `/api/recording/record-stop`        | Stop screen recording                     |
| `POST`   | `/api/llm-playwright/start-recording` | Start screen recording of a URL (via Playwright). Recording runs until `stop-recording` is called. |
| `POST`   | `/api/llm-playwright/stop-recording`  | Stop active screen recording (via Playwright) |
| `POST`   | `/api/recording`                    | Create a new recording entry (Admin only) |
| `GET`    | `/api/recording`                    | Retrieve all recordings (Admin only)      |
| `GET`    | `/api/recording/paginated`          | Paginated recordings (Admin only)         |
| `GET`    | `/api/recording/:id`                | Find recording by ID (Admin only)         |
| `PATCH`  | `/api/recording/:id`                | Update recording by ID (Admin only)       |
| `DELETE` | `/api/recording/:id`                | Delete recording by ID (Admin only)       |

---

## Project Structure

```
src/
├── account/            # User account management
├── album/              # Management of music albums
├── app.module.ts       # Root module
├── artist/             # Management of music artists
├── auth/               # User authentication, authorization, OAuth (Google, GitHub)
├── aws/                # AWS service integrations (EC2, RDS, S3, DynamoDB, Security Groups, Billing)
├── bulk-data/          # Bulk data import/export functionalities
├── chat/               # Chat services and WebSockets
├── code-extractor/     # Extracting code from various file formats
├── command-history/    # Persistence for terminal command history
├── common/             # Common DTOs, services, and helpers
├── config/              # Application configuration (e.g., feature flags)
├── conversation/       # Chat conversation history for AI interactions
├── database/           # Database management and SQL utilities
├── endpoints/          # API endpoint discovery and constants generation
├── eslint/             # ESLint integration for code linting
├── feature/            # Feature toggle management
├── ffmpeg/             # FFmpeg integration for audio/video processing
├── file/               # Local and remote file system operations (read, write, list, stream, SSH/SFTP)
├── folder/             # Folder specific operations
├── gemini-request/     # Persistence for Gemini AI requests
├── gemini-response/    # Persistence for Gemini AI responses
├── google/             # Google AI integrations (Gemini, TTS, Image Captioning, Video Generation, Live AI, Translation)
├── icon/               # Icon management service
├── llm/                # Large Language Model integration for code generation, analysis, and repair
├── llm-playwright/     # Playwright integration for browser automation and screen recording
├── log/                # Application logging with persistence
├── logs/               # Log file management
├── mail/               # Email sending (e.g., for verification)
├── manifest/           # Manifest generation service
├── media/              # Media file management and transcription
├── metadata/           # Metadata management for various entities
├── module-control/     # Toggle modules on/off
├── music-history/      # User music listening history
├── openvidu/           # OpenVidu integration for video conferencing sessions and tokens
├── organization/       # Organization management
├── planner/            # AI planner for task execution
├── playlist/           # Management of user-created media playlists
├── playlist-media-file/# Join table for playlists and media files
├── prisma/             # Prisma ORM setup and service
├── project/            # Project management (metadata, status, etc.)
├── proxy/              # URL proxy service
├── recording/          # Screen recording and screenshot capture
├── repos/              # GitHub repository management
├── resume/             # Resume parsing and generation services
├── schema/             # Dynamic schema definition management
├── schema-submission/  # Handling submissions against defined schemas
├── setup/              # Initial application setup and environment configuration
├── shared/             # Shared interfaces and constants
├── song/               # Management of music songs
├── subtitle/           # Subtitle processing service
├── system-instruction/ # Management of AI system instructions
├── terminal/           # Terminal command execution, local and remote SSH shell, session management
├── terminal-command/   # Persistence for user-defined terminal commands
├── terminal-session/   # Persistence for terminal session metadata
├── transpiler/         # Code transpilation services (e.g., JS/TS/React/Solid JSX)
├── types/              # Global TypeScript type definitions
├── user/               # User management (beyond authentication)
└── utils/              # General utilities (encoding, markdown, SQL parsing, image conversion, JSON/YAML, transpilation, ESLint)
└── video/              # Management of video content
```

---

## CLI Tool for Module Scaffolding

This project includes a custom Nest CLI scaffolding tool that streamlines the creation of new modules, complete with services, controllers, and DTOs.

### Automatic `createdBy` Injection

#### How It Works

If the Prisma model contains either a `createdBy` or `createdById` field, and the model is **not** `User`, the generated service will:

-   Inject the current user from the request (via `REQUEST`).
-   Attach the authenticated user as the creator:

    ```ts
    createData.createdBy = {
      connect: { id: this.userId },
    };
    ```

-   Automatically remove `createdById` from the DTO to avoid Prisma conflicts if both are present.

#### Requirements

-   Your Prisma model must define either:

    ```prisma
    createdBy   User   @relation(fields: [createdById], references: [id])
    createdById String
    ```

    or simply:

    ```prisma
    createdBy   User   @relation(fields: [createdBy], references: [id])
    ```

-   The model must not be `User` itself to avoid circular logic during user creation.

#### Protected Models

This works in conjunction with the `libs/protected-models.ts` configuration, which enables route protection and user context injection.

---

## Author

Made with love by [Eddie Villanueva](https://github.com/evillan0315)
📧 [evillan0315@gmail.com](mailto:evillan0315@gmail.com)
