# Architecture

This document describes the overall architecture of the Project Planner Server, detailing its main components, their interactions, and the exposed API endpoints.

## High-Level Design

The Project Planner Server is built with Node.js and Fastify, providing a high-performance and low-overhead web framework. It follows a modular design, separating concerns into distinct services and routers for maintainability and scalability.

**Core Components:**

-   **Fastify Server:** The main entry point, responsible for routing requests, managing middleware (CORS, cookies, sessions), and integrating Passport.js for authentication.
-   **Prisma ORM:** Used for all database interactions with PostgreSQL, providing type-safe queries and migrations.
-   **Passport.js:** Handles authentication strategies for local email/password, Google OAuth2, and GitHub OAuth2.
-   **Modular Services:** Business logic is encapsulated in various services (Auth, Mail, Planner, LLM, Executor, GitUtil, Config) that interact with each other and the database.

## Key Modules and Services

### [Authentication Module](auth/index.md)
Handles user registration, login, session management, email verification, password reset, and OAuth integrations.

### [AI Planner Module](planner/index.md)
The core AI-driven planning functionality, orchestrating interactions with LLMs and Git operations.

### [Git Utility Module](git/index.md)
Provides an abstraction layer over `simple-git` for performing various Git operations on the project repository.

### [Mail Module](mail/index.md)
Facilitates sending transactional emails such as verification and password reset links.

### [Configuration Module](config/index.md)
Manages environment variables, providing a type-safe way to access configuration settings using Zod validation.

### Common Utilities
-   **`errors.ts`**: Defines a custom error class (`CustomError`) for consistent error handling across the application.

## Data Flow (Example: AI Plan Generation & Application)

1.  **Client Request:** A user sends a prompt to `/api/plan`.
2.  **Authentication:** The request passes through JWT authentication via `fastifyPassport`.
3.  **Planner Router:** The request reaches `plannerRouter`, which delegates to `PlannerService`.
4.  **Planner Service:** Calls `LlmService.generatePlan` with the user prompt and relevant project context.
5.  **LLM Service:** Selects an AI model (Gemini or OpenAI) based on configuration, constructs a prompt, and sends it to the respective AI API.
6.  **AI Model Response:** The AI model returns a structured plan (e.g., a JSON object detailing file changes).
7.  **Planner Service (Validation & Persistence):** Validates the AI-generated plan using `validator.ts` and persists it to the PostgreSQL database via `PrismaService`.
8.  **Client Response:** The generated plan ID and the plan details are returned to the client.
9.  **Client Request (Apply Plan/Chunk):** User decides to apply the plan (or a chunk) by sending a request to `/api/plan/apply` or `/api/plan/:id/apply-chunk/:index`.
10. **Planner Service (Application):** Retrieves the plan from the database and passes the relevant changes to `ExecutorService`.
11. **Executor Service:**
    -   Creates a Git branch (`ai/plan-timestamp`) and commits the current state as a snapshot.
    -   Iterates through the file changes (add, modify, delete).
    -   For modifications with `diff` content, it uses `GitUtilService.applyPatch`.
    -   For other actions, it directly manipulates the file system (`fs/promises`).
    -   After applying changes, it runs static analysis checks (TypeScript compilation, ESLint) if configured.
    -   If checks pass, it stages and commits the changes.
    -   If checks fail or any step fails, it attempts to `git reset --hard` to the snapshot created at the beginning, ensuring atomicity.
12. **Git Utility Service:** Performs low-level Git commands (checkout, commit, apply, reset, etc.) as requested by `ExecutorService`.
13. **Client Response:** Returns success or failure status of the application, along with details.

## API Endpoints

This server exposes the following main API routes. Detailed usage and request/response schemas can be found within the respective module documentation (e.g., [Authentication](auth/index.md), [Planner](planner/index.md)).

### Authentication (`/auth`)
-   `POST /auth/register`: Register a new user.
-   `POST /auth/login`: Log in a user and receive JWT tokens.
-   `POST /auth/logout`: Clear authentication cookies.
-   `GET /auth/google`: Initiate Google OAuth flow.
-   `GET /auth/google/callback`: Google OAuth callback endpoint.
-   `GET /auth/github`: Initiate GitHub OAuth flow.
-   `GET /auth/github/callback`: GitHub OAuth callback endpoint.
-   `POST /auth/resend-verification`: Resend email verification link.
-   `GET /auth/verify-email`: Verify user email with token.
-   `POST /auth/forgot-password`: Request a password reset link.
-   `POST /auth/reset-password`: Reset password with a token.
-   `GET /auth/me`: Get current user details (requires authentication).

### AI Planner (`/api/plan`)
-   `POST /api/plan`: Generate an AI plan from a prompt.
-   `GET /api/plan/:id`: Retrieve a specific AI plan.
-   `GET /api/plan/:id/chunks`: Get plan changes chunked.
-   `POST /api/plan/:id/apply-chunk/:index`: Apply a specific chunk of a plan.
-   `POST /api/plan/apply`: Apply an entire AI plan.