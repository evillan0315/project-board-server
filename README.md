# Full-Stack Developer Toolkit & Utilities Server

A comprehensive backend application built with **NestJS**, providing robust authentication, extensive file and folder management (local and remote), powerful AI-powered code and content generation (Google Gemini), a suite of developer utilities, and screen recording capabilities. Designed for rapid development and enhanced productivity.

---

## \U0001f510 Key Features

### \u2705 JWT-based authentication via HTTP-only cookies and optional Bearer header

\u2705 User registration and login with `bcrypt` password hashing
\u2705 Email verification flow (on registration, resend, and token verification)
\u2705 OAuth2 login support for Google and GitHub
\u2705 Role-based access control (RBAC) with `@Roles()` decorator and guard
\u2705 Swagger API documentation for all endpoints

### \U0001f4c1 File & Folder Management

- \u2705 **Local File Operations:** Read, write, create, delete, rename, search, list files and folders.
- \u2705 **Media Streaming:** Stream audio/video files with HTTP range support.
- \u2705 **File Downloads:** Directly download files to the client.
- \u2705 **Content Resolution:** Read file content from uploaded files, local paths, or URLs.
- \u2705 **Multiple File Operations:** Upload and read content from multiple files.
- \u2705 **Project Scanning:** Recursively scan directories for relevant code files, useful for AI context building (with intelligent exclusion lists).
- \u2705 **Real-time Collaboration (WebSockets):** Open, close, update, create, and delete files with real-time notifications for collaborative editing.
- \u2705 **Remote File Management (SSH/SFTP):**
  - List files and directories on remote servers.
  - Create, update, and delete remote files.
  - Download files from remote servers.
  - Execute shell commands on remote servers.
- \u2705 **GitHub Repository Management:** Create, commit, delete, list, and view contents of GitHub repositories.

### \U0001f9e0 Generative AI (Google Gemini)

- \u2705 **Text Generation:** General purpose text generation from prompts.
- \u2705 **Image Captioning:** Generate descriptions for images from URLs or local files.
- \u2705 **Text-to-Speech (TTS):** Convert text to natural-sounding speech audio (single and multi-speaker).
- \u2705 **Code Generation:** Generate code snippets based on natural language instructions.
- \u2705 **Code Documentation:** Generate documentation for code snippets (e.g., JSDoc, Markdown).
- \u2705 **Code Optimization:** Improve code for performance and readability.
- \u2705 **Code Analysis:** Identify issues, improvements, and best practices in code.
- \u2705 **Code Repair:** Fix syntax or logical errors in code.
- \u2705 **File Content Analysis:** Analyze content from uploaded files (e.g., SQL schemas, text documents).
- \u2705 **Resume Tools:**
  - Generate new resumes based on detailed prompts.
  - Optimize existing resumes against job descriptions.
  - Enhance specific resume sections for impact.

### \U0001f528 Developer Utilities

- \u2705 **Image Conversion:** Convert images (PNG, JPG) to SVG (Vector graphics).
- \u2705 **Code Formatting:** Format source code using Prettier (supports various languages).
- \u2705 **JSDoc to Markdown:** Generate Markdown documentation directly from JSDoc comments in TypeScript/TSX files.
- \u2705 **Markdown Conversions:**
  - Convert Markdown to plain text.
  - Convert Markdown to HTML (with global CSS styling).
  - Convert Markdown to JSON AST (Abstract Syntax Tree).
  - Convert Markdown to DOCX (Microsoft Word Document).
- \u2705 **HTML to DOCX:** Convert HTML content to a DOCX document.
- \u2705 **SQL Utilities:** Parse `SELECT` and `INSERT` statements to JSON, and generate `INSERT` SQL from JSON.
- \u2705 **String Utilities:** Capitalize, kebab-case, reverse, truncate text, unique array filter, time ago formatting, Unix timestamp conversion.
- \u2705 **Environment Variable Handling:** Convert `.env` files to JSON and JSON objects to `.env` strings.
- \u2705 **JSON/YAML Conversion:** Bidirectional conversion between JSON objects and YAML strings.
- \u2705 **Encoding/Decoding:** Base64 and URL encoding/decoding.
- \u2705 **Code Highlighting:** Syntax highlighting for various programming languages.
- \u2705 **ESLint Integration:** Lint code strings and retrieve detailed diagnostics (errors, warnings, fixes).
- \u2705 **Code Transpilation:** Transpile JavaScript/TypeScript, React JSX, SolidJS JSX using ESBuild, supporting single files, multiple files, and ZIP archives.
- \u2705 **Interactive Terminal & Remote Shell:** Execute local terminal commands and establish persistent SSH sessions to remote servers with real-time input/output (via WebSockets), **including command history persistence and session logging.**

### \U0001f39e Screen Recording & Screenshots

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| `POST` | `/api/recording/capture`      | Take a screenshot of the screen |
| `POST` | `/api/recording/record-start` | Start screen recording          |
| `POST` | `/api/recording/record-stop`  | Stop screen recording           |
| `GET`  | `/api/recording/list`         | List all saved recordings       |

---

## \U0001f680 Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/evillan0315/project-board-server.git
cd project-board-server
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL='postgresql://...' # Your PostgreSQL database connection string
JWT_SECRET='your_jwt_secret' # Secret for JWT token signing

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

# Base URL for API (for email verification links, etc.)
BASE_URL='http://localhost:3000'
BACKEND_URL='http://localhost:5000'
FRONTEND_URL='http://localhost:3001' # Your frontend URL for OAuth redirects

# SSH Config for Remote File Operations (Update with your server details)
SSH_HOST='your_remote_server_ip_or_hostname'
SSH_PORT=22
SSH_USERNAME='your_ssh_username'
SSH_PRIVATE_KEY_PATH='/path/to/your/ssh/private_key' # e.g., ~/.ssh/id_rsa
SSH_PASSPHRASE='your_private_key_passphrase' # Optional, if your key is encrypted

# Base Directory for Local File Operations (optional, defaults to CWD)
BASE_DIR='/path/to/your/project_root'
```

### 3. Generate Prisma Client and Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Install External System Dependencies (if needed)

- **FFmpeg:** Required for screen recording and screenshots. [Download & Install FFmpeg](https://ffmpeg.org/download.html)
- **Pandoc:** Required for converting Markdown/HTML to DOCX. [Download & Install Pandoc](https://pandoc.org/installing.html)

### 5. Run the Application

```bash
pnpm run start:dev
```

### 6. Access Swagger API Documentation

Visit [http://localhost:3000/api](http://localhost:3000/api) for the full interactive Swagger UI documentation, detailing all available endpoints and their usage.

---

## \U0001f680 API Workflows

### \U0001f510 Authentication & User Management

| Method | Endpoint                           | Description                    |
| ------ | ---------------------------------- | ------------------------------ |
| `POST` | `/api/auth/register`               | Register a new user            |
| `GET`  | `/api/auth/verify-email?token=...` | Verify user email              |
| `POST` | `/api/auth/login`                  | Log in a user                  |
| `POST` | `/api/auth/logout`                 | Log out user (clear cookie)    |
| `GET`  | `/api/auth/google`                 | Initiate Google OAuth2 login   |
| `GET`  | `/api/auth/github`                 | Initiate GitHub OAuth2 login   |
| `GET`  | `/api/auth/me`                     | Get current authenticated user |

### \U0001f4c1 File & Folder Management

| Method   | Endpoint                    | Description                                 |
| -------- | --------------------------- | ------------------------------------------- |
| `GET`    | `/api/file/list`            | List contents of a directory                |
| `POST`   | `/api/file/read`            | Read content of a file (upload, path, URL)  |
| `POST`   | `/api/file/create`          | Create a new file or folder                 |
| `POST`   | `/api/file/delete`          | Delete a file or folder                     |
| `POST`   | `/api/file/rename`          | Rename a file or folder                     |
| `POST`   | `/api/file/scan`            | Scan project directories for relevant files |
| `GET`    | `/api/file/stream`          | Stream media files with range support       |
| `GET`    | `/api/remote/list`          | List files on a remote server (SSH/SFTP)    |
| `GET`    | `/repos`                    | Get all repositories from GitHub            |
| `GET`    | `/repos/:repoName`          | Get a single repository by name             |
| `POST`   | `/repos`                    | Create a new GitHub repository              |
| `PATCH`  | `/repos/:repoName/commit`   | Simulate a commit to a repository           |
| `DELETE` | `/repos/:repoName`          | Delete a GitHub repository                  |
| `GET`    | `/repos/:repoName/contents` | Get repository files and directory contents |

### \U0001f9e0 Generative AI (Google Gemini)

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

### \U0001f4bb Developer Utilities & Shell

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

### \U0001f39e Screen Recording & Screenshots

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| `POST` | `/api/recording/capture`      | Take a screenshot of the screen |
| `POST` | `/api/recording/record-start` | Start screen recording          |
| `POST` | `/api/recording/record-stop`  | Stop screen recording           |
| `GET`  | `/api/recording/list`         | List all saved recordings       |

---

## \U0001f4c2 Project Structure

```
src/
├── auth/               # User authentication, authorization, OAuth (Google, GitHub)
├── common/             # Common services (e.g., file validation) and DTOs
├── conversation/       # Chat conversation history for AI interactions
├── file/               # Local and remote file system operations (read, write, list, stream, SSH/SFTP)
├── google/             # Google AI integrations (Gemini, TTS, Image Captioning)
├── mail/               # Email sending (e.g., for verification)
├── module-control/     # Toggle modules on/off
├── prisma/             # Prisma ORM setup and service
├── recording/          # Screen recording and screenshot capture
├── terminal/           # Terminal command execution, local and remote SSH shell
└── utils/              # General utilities (encoding, markdown, SQL parsing, image conversion, JSON/YAML, transpilation, ESLint)
```

---

## \U0001f4dd CLI Tool for Module Scaffolding

This project includes a custom Nest CLI scaffolding tool that streamlines the creation of new modules, complete with services, controllers, and DTOs.

### \U0001f504 Automatic `createdBy` Injection

The resource generator now includes support for auto-injecting the authenticated user as the `createdBy` relation in create operations.

#### \U0001f9e0 How It Works

If the Prisma model contains either a `createdBy` or `createdById` field, and the model is **not** `User`, the generated service will:

- Inject the current user from the request (via `REQUEST`).
- Attach the authenticated user as the creator:

  ```ts
  createData.createdBy = {
    connect: { id: this.userId },
  };
  ```

- Automatically remove `createdById` from the DTO to avoid Prisma conflicts if both are present.

#### \u2705 Requirements

- Your Prisma model must define either:

  ```prisma
  createdBy   User   @relation(fields: [createdById], references: [id])
  createdById String
  ```

  or simply:

  ```prisma
  createdBy   User   @relation(fields: [createdBy], references: [id])
  ```

- The model must not be `User` itself to avoid circular logic during user creation.

#### \U0001f512 Protected Models

This works in conjunction with the `libs/protected-models.ts` configuration, which enables route protection and user context injection.

---

## \U0001f9d1\u200d\U0001f4bb Author

Made with love by [Eddie Villanueva](https://github.com/evillan0315)
\U0001f4e8 [evillan0315@gmail.com](mailto:evillan0315@gmail.com)

---
