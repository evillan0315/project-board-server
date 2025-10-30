# Project Planner Server

**Description:** Plain Node.js server for an AI-powered project planner with robust authentication.

This backend application provides the core logic for an AI-driven project planning tool. It features user authentication (local, Google, GitHub OAuth), email verification, password management, and an intelligent planner service that leverages AI models (Google Gemini or OpenAI) to generate and apply code changes directly to a Git repository.

## Features

- **User Authentication:** Secure local authentication with email verification and password reset functionality.
- **OAuth Integrations:** Seamless login via Google and GitHub accounts.
- **Role-Based Access Control:** Basic user roles defined ( extensible).
- **AI-Powered Planning:** Integrates with Google Gemini or OpenAI to generate code changes based on user prompts.
- **Git Operations:** Executes various Git commands to apply AI-generated changes, create snapshots, manage branches, and more.
- **Database Management:** Uses Prisma ORM for type-safe database interactions (PostgreSQL).
- **Email Service:** Nodemailer integration for sending verification and password reset emails.
- **Configuration Management:** Environment variable validation using Zod.

## Technology Stack

- **Backend:** Node.js, Fastify
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** Passport.js (JWT, Google OAuth2, GitHub OAuth2), bcrypt, jsonwebtoken
- **AI:** Google Gemini API, OpenAI API (configurable)
- **Version Control:** simple-git for Git operations
- **Validation:** Zod, class-validator
- **Utilities:** dotenv, uuid, nodemailer

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or Yarn
- PostgreSQL database
- Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/project-planner-server.git
    cd project-planner-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the project root based on `.env.example` (or the provided example below) and fill in your details.

    ```env
    # Server Port and Environment
    PORT=4000
    NODE_ENV=development

    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/planner_db"

    # JWT Secrets
    JWT_SECRET="a_very_strong_and_unique_jwt_secret_key"
    JWT_VERIFICATION_SECRET="a_strong_secret_for_email_verification_tokens"
    JWT_VERIFICATION_EXPIRES_IN="1h"

    # Frontend URL (for OAuth redirects and password reset links)
    FRONTEND_URL="http://localhost:3000"
    BASE_URL="http://localhost:${PORT}"

    # Google OAuth2 Credentials (Get from Google Cloud Console)
    GOOGLE_CLIENT_ID='your_google_client_id'
    GOOGLE_CLIENT_SECRET='your_google_client_secret'
    GOOGLE_CALLBACK_URL="${BASE_URL}/auth/google/callback"

    # GitHub OAuth2 Credentials (Get from GitHub Developer Settings)
    GITHUB_CLIENT_ID='your_github_client_id'
    GITHUB_CLIENT_SECRET='your_github_client_secret'
    GITHUB_CALLBACK_URL="${BASE_URL}/auth/github/callback"

    # Google Gemini AI Credentials (Get from Google AI Studio)
    GOOGLE_GEMINI_API_KEY='your_gemini_api_key'
    GOOGLE_GEMINI_MODEL='gemini-1.5-flash'

    # Optional OpenAI API Key (if preferred over Gemini)
    # OPENAI_API_KEY='your_openai_api_key'

    # Base Directory for Git Operations (defaults to server's CWD). 
    # Set this if your project's git root is different from the server's root.
    # BASE_DIR='/path/to/your/actual/git/project_root'

    # Mailer Configuration (e.g., for Gmail with App Password)
    MAIL_SERVICE='gmail'
    MAIL_USER='your-email@gmail.com'
    MAIL_PASS='your-gmail-app-password' # Use an App Password if 2FA is enabled
    MAIL_FROM='"Project Planner" <your-email@gmail.com>'
    ```

4.  **Database Setup:**
    Ensure your PostgreSQL database is running, then apply Prisma migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
    *Note: The `init` name is a suggestion. You can use any descriptive name for your first migration.* 

### Running the Application

-   **Development Mode (with hot-reloading):**
    ```bash
    npm run start:dev
    ```

-   **Production Build & Start:**
    ```bash
    npm run build
    npm start
    ```

    The server will start on the port specified in your `.env` file (default: `4000`).

## API Endpoints

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

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.