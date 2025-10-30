# Project Planner

## Overview
Project Planner is an AI-powered application designed to help developers manage their projects more efficiently. It leverages Large Language Models (LLMs) to generate and apply code changes based on natural language prompts, manage Git operations, and facilitate project planning. The application features a robust backend built with Node.js, Fastify, and Prisma, supporting user authentication via email/password and OAuth (Google, GitHub), and a React frontend (frontend directory - not provided in current context but assumed).

## Features

### AI-Powered Code Generation
*   **Natural Language Prompts**: Describe desired code changes in plain English.
*   **LLM Integration**: Utilizes Google Gemini (with an option for OpenAI GPT) to understand prompts and generate detailed plans.
*   **File Change Planning**: Generates a plan detailing file additions, modifications, and deletions, including content or diffs.
*   **Chunked Application**: Apply plan changes in manageable chunks.

### Git Integration
*   **Version Control**: Seamlessly integrates with Git to manage code changes.
*   **Snapshots**: Create and restore project snapshots (Git tags) before applying AI-generated changes.
*   **Automated Rollbacks**: Automatically reverts changes if generated code introduces compilation errors (TypeScript).
*   **Git Operations**: Supports staging, committing, diffing, branching, and reverting.

### User Management
*   **Authentication**: Secure user authentication with email/password.
*   **OAuth**: Supports login via Google and GitHub.
*   **Email Verification & Password Reset**: Standard secure flows for account management.
*   **Role-Based Access**: Basic user roles for access control.

### Technologies Used

**Backend (Node.js/Fastify)**
*   **Fastify**: High-performance web framework.
*   **TypeScript**: Statically typed superset of JavaScript.
*   **Prisma**: Next-generation ORM for Node.js and TypeScript.
*   **PostgreSQL**: Relational database.
*   **Passport.js**: Authentication middleware for Node.js (with Fastify Passport).
*   **simple-git**: Library for running Git commands.
*   **dotenv**: Loading environment variables.
*   **nodemailer**: Email sending.
*   **bcrypt**: Password hashing.
*   **jsonwebtoken**: JWT-based authentication.
*   **zod**: Schema validation.

**Frontend (React)** - *(Assumed, as per project context)*
*   **React**: JavaScript library for building user interfaces.
*   **Vite**: Next-generation frontend tooling.
*   **TypeScript**: Statically typed JavaScript.
*   **Material UI**: React component library for faster and easier web development.
*   **Tailwind CSS**: Utility-first CSS framework.
*   **Nanostores**: Tiny state manager for React.

## Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   Docker (for easy PostgreSQL setup) or a local PostgreSQL instance
*   Git

### 1. Clone the repository
```bash
git clone https://github.com/your-username/project-planner.git
cd project-planner
```

### 2. Backend Setup (`server` directory)

Navigate to the `server` directory:
```bash
cd server
```

#### Environment Variables
Create a `.env` file in the `server` directory based on `.env.example` (or the provided `.env` context):

```env
PORT=4000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planner_db"

JWT_SECRET="supersecretjwtkey_replace_with_strong_random_key"
JWT_VERIFICATION_SECRET="emailverificationsecret_replace_with_strong_random_key"
JWT_VERIFICATION_EXPIRES_IN="1h"

# Frontend URL for OAuth redirects and password reset links
FRONTEND_URL="http://localhost:3000"
BASE_URL="http://localhost:${PORT}"

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID='your_google_client_id'
GOOGLE_CLIENT_SECRET='your_google_client_secret'
GOOGLE_CALLBACK_URL="${BASE_URL}/auth/google/callback"

# GitHub OAuth2 Credentials
GITHUB_CLIENT_ID='your_github_client_id'
GITHUB_CLIENT_SECRET='your_github_client_secret'
GITHUB_CALLBACK_URL="${BASE_URL}/auth/github/callback"

# Google Gemini AI Credentials
GOOGLE_GEMINI_API_KEY='your_gemini_api_key'
GOOGLE_GEMINI_MODEL='gemini-1.5-flash'

# Optional OpenAI API Key (if preferred over Gemini)
# OPENAI_API_KEY='your_openai_api_key'

# Base Directory for Git Operations (defaults to server's CWD)
# BASE_DIR='/path/to/your/project_root_for_git' # Set this to your project's root if you want AI to interact with files outside the 'server' directory

# Mailer Configuration (for email verification and password reset)
MAIL_SERVICE='gmail' # e.g., 'gmail', 'SendGrid', etc.
MAIL_USER='your-email@gmail.com'
MAIL_PASS='your-gmail-app-password' # Use app password if 2FA is on for Gmail
MAIL_FROM='"Project Planner" <your-email@gmail.com>'
```

*   **`DATABASE_URL`**: Update if your PostgreSQL setup is different.
*   **`JWT_SECRET` / `JWT_VERIFICATION_SECRET`**: Generate strong, random strings for production.
*   **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`**: Obtain these from Google Cloud Console and GitHub Developer Settings respectively. Ensure `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` are correctly set to your `BASE_URL/auth/provider/callback`.
*   **`GOOGLE_GEMINI_API_KEY` or `OPENAI_API_KEY`**: Obtain an API key for your preferred LLM. At least one is required for AI features.
*   **`MAIL_USER` / `MAIL_PASS`**: Configure for email services (e.g., Gmail with an app password).
*   **`BASE_DIR`**: Important for AI Git operations. If the AI needs to modify files outside the `server` directory (e.g., in `frontend` or the project root), set this to the absolute path of your `project-planner` root directory.

#### Database Setup (PostgreSQL with Docker)

If you don't have PostgreSQL running, you can use Docker:
```bash
docker run --name project-planner-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=planner_db -p 5432:5432 -d postgres:16-alpine
```

#### Install Dependencies & Run Migrations
```bash
npm install
npx prisma migrate dev --name init # Applies initial database schema and generates Prisma client
```

#### Run the Backend Server
```bash
npm run start:dev # For development with hot-reloading
# or
npm run build # Compile TypeScript
npm start # Run compiled JavaScript
```

### 3. Frontend Setup (`frontend` directory) - *(Conceptual based on project context)*

Navigate to the `frontend` directory:
```bash
cd ../frontend
```

#### Environment Variables
Create a `.env` file for your React app. It typically needs `VITE_API_URL` and OAuth client IDs:

```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

#### Install Dependencies & Run Frontend
```bash
npm install
npm run dev
```

The frontend application should now be running on `http://localhost:3000` (or as configured).

## API Endpoints (Backend)

All endpoints are prefixed with `/auth` or `/api/plan`.

### Authentication (`/auth`)
*   `POST /auth/register`: Register a new user.
*   `POST /auth/login`: Log in a user.
*   `POST /auth/logout`: Log out a user.
*   `GET /auth/me`: Get current user details (requires JWT token).
*   `GET /auth/google`: Initiate Google OAuth login.
*   `GET /auth/google/callback`: Google OAuth callback handler.
*   `GET /auth/github`: Initiate GitHub OAuth login.
*   `GET /auth/github/callback`: GitHub OAuth callback handler.
*   `POST /auth/resend-verification`: Resend email verification.
*   `GET /auth/verify-email?token=<token>`: Verify user email.
*   `POST /auth/forgot-password`: Request a password reset link.
*   `POST /auth/reset-password`: Reset password using a token.

### AI Planner (`/api/plan`)
*   `POST /api/plan`: Generate a new plan from a prompt.
    *   Body: `{ userPrompt: string, projectStructure?: string, relevantFiles?: { relativePath: string, content: string }[], additionalInstructions?: string, expectedOutputFormat: string }`
*   `GET /api/plan/:id`: Retrieve a specific plan by ID.
*   `GET /api/plan/:id/chunks`: Get plan changes chunked into smaller groups.
*   `POST /api/plan/:id/apply-chunk/:index`: Apply a specific chunk of a plan.
*   `POST /api/plan/apply`: Apply an entire plan directly.
    *   Body: `{ plan: { title: string, summary: string, changes: { filePath: string, action: 'ADD' | 'MODIFY' | 'DELETE', newContent?: string, diff?: string }[] } }`

## Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
