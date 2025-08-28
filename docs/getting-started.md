# Getting Started

This guide will walk you through setting up and running the full-stack monorepo project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: `^18.0.0` or later (LTS recommended).
- **pnpm**: Version `8.x` or later. Install with `npm install -g pnpm`.
- **Git**: For cloning the repository.
- **Docker & Docker Compose**: (Recommended) For easily setting up PostgreSQL and other services.
- **PostgreSQL**: (Alternatively, if not using Docker) A local PostgreSQL instance.
- **Google Cloud Project & Gemini API Key**: Required for AI functionalities.
  - Enable the Gemini API in your Google Cloud Project.
  - Create an API key and enable the `generativelanguage.googleapis.com` API.
  - **Important**: Keep your API key secure and do not commit it to version control.

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/evillan0315/project-board-server.git # Replace with actual repo URL
cd project-board-server
```

### 2. Install Dependencies

This project uses `pnpm workspaces` for monorepo management.

```bash
pnpm install
```

### 3. Environment Configuration

The project relies on environment variables for various configurations, including API keys, database connections, and application settings.

- **Root `.env` (for backend):**
  Create a `.env` file in the project root (`full-stack/.env`). A `.env.example` might be provided, or you can create it with the following:

  ```env
  # Database
  DATABASE_URL="postgresql://user:password@localhost:5432/your_database"
  DATABASE_URL_APPDB="postgresql://user:password@localhost:5432/your_appdb_database"

  # Google Gemini API (required for AI features)
  GOOGLE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

  # Github OAuth (optional, for authentication)
  GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
  GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"
  GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/github/callback"

  # Google OAuth (optional, for authentication)
  GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
  GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
  GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

  # JWT Secret (for authentication)
  JWT_SECRET="supersecretjwtkey"

  # Other settings
  PORT=3000
  # ... any other backend-specific variables
  ```

- **Frontend `.env` files:**
  Some frontend applications might have their own `.env` files (e.g., `frontend/.env`, `code-editor/.env`). Check their respective folders for `.env.example` files. Typically, these would mirror relevant backend URLs or public API keys.

  For example, `frontend/.env`:

  ```env
  VITE_API_BASE_URL="http://localhost:3000/api"
  # ... other frontend-specific variables
  ```

### 4. Database Setup

The backend uses Prisma for ORM.

#### Using Docker (Recommended)

If you have Docker installed, you can use `docker-compose.yaml` (if available, or create one) to run a PostgreSQL container:

```yaml
# docker-compose.yaml (example, create if not present)
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: your_database
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Start the database:

```bash
docker compose up -d db
```

#### Run Prisma Migrations

After setting up your database (either locally or via Docker), apply the Prisma migrations to create the necessary tables:

```bash
pnpm prisma migrate dev --name init # Or adjust command based on existing migrations
```

### 5. Running the Backend

The main backend service is located in `src/`.

```bash
pnpm run start:dev
```

This will typically start the NestJS server on `http://localhost:3000`.

### 6. Running Frontend Applications

Each frontend application is located in its respective folder (`apps/ai-editor-front`, `apps/point-of-sale`, `code-editor`, `frontend`). You'll need to run them separately.

#### Example: Running the Main Frontend (Dashboard)

```bash
cd frontend
pnpm run dev
# This will typically start on http://localhost:5173 or similar
```

#### Example: Running the Code Editor

```bash
cd code-editor
pnpm run dev
# This will typically start on http://localhost:5174 or similar
```

Repeat similar commands for `apps/ai-editor-front` and `apps/point-of-sale` if you intend to use them. Check their respective `package.json` for specific `dev` scripts.

### 7. Running the AI Editor CLI

The AI Editor CLI is located in `ai-editor/`.

```bash
cd ai-editor
pnpm run cli -- help
pnpm run cli -- scan # Example command
```

Now you should have all components of the full-stack monorepo running!
