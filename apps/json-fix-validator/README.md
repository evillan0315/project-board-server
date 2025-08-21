# 🚀 JSON Fixer & Validator App

[![License](https://img.shields.io/github/license/your-username/your-repo)](LICENSE)

> A simple web application to validate and repair JSON strings using a backend service.

---

## 📖 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)
- [Contact](#-contact)

---

## ✨ Features

- ⚡ **JSON Validation**: Check if a JSON string is syntactically correct and optionally validate against a JSON schema.
- 🛠️ **JSON Repair**: Attempt to fix malformed JSON, such as missing quotes, commas, or unescaped characters.
- 🌐 **Web Interface**: User-friendly web form for inputting JSON/schema and viewing results.
- ⚛️ **React Frontend**: Built with React, TypeScript, Material-UI, and Tailwind CSS.
- 🔐 **User Authentication**: OAuth2 login with Google and GitHub to access protected backend endpoints.

---

## 📂 Project Structure

```bash
json-fix-validator/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── ui/        # Reusable UI components
│   │   ├── Layout.tsx
│   │   └── Navbar.tsx
│   ├── pages/
│   │   ├── JsonFixerPage.tsx # Main application page
│   │   └── LoginPage.tsx     # OAuth login page
│   ├── services/
│   │   ├── authService.ts    # Authentication API interactions
│   │   └── jsonFixService.ts # API interactions for JSON fix module
│   ├── stores/
│   │   └── authStore.ts      # Nanostores for authentication state
│   ├── types/
│   │   ├── auth.ts           # TypeScript type definitions for auth
│   │   └── json-fix.ts       # TypeScript type definitions for DTOs
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example      # Example environment variables
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite build configuration
└── README.md         # Project documentation
```

---

## 📋 Requirements

- Node.js >= 18
- Corresponding NestJS backend running (e.g., `full-stack` project) that exposes the `/api/utils/json` and `/api/auth` endpoints.

---

## 🛠️ Installation

```bash
# Navigate to the root of your monorepo
cd /media/eddie/Data/projects/nestJS/nest-modules/full-stack

# Install dependencies for all apps in the monorepo
pnpm install

# Navigate into the json-fix-validator app directory
cd apps/json-fix-validator

# Create a .env file based on the example
cp .env.example .env
# Edit .env to point to your backend API URL and configure OAuth callbacks:
# VITE_API_URL=http://localhost:3000
# VITE_FRONTEND_URL=http://localhost:3000 (Or your actual frontend URL)
# GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
# GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
# GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
# GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

**Note**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` are primarily used by the backend. However, `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` are used by Vite to configure the OAuth redirects correctly in the frontend context.

---

## ⚙️ Usage

First, ensure your NestJS backend is running, providing the `/api/utils/json` and `/api/auth` endpoints.

```bash
# In the json-fix-validator app directory
cd apps/json-fix-validator

# Start the development server
pnpm run dev
```

Open your browser to the address indicated by Vite (usually `http://localhost:3000`). You will now see a login button in the navbar. The JSON validation and repair features require authentication, so you will need to log in via Google or GitHub.

---

## 📖 API Reference

This application consumes the following backend endpoints:

### `POST /api/utils/json/validate`

Validates a JSON string, optionally against a JSON schema.

**Request Body**
`JsonInputDto` (contains `json` string and optional `schema` string/object)

**Response**
`JsonOutputDto` (contains `valid: boolean`, `errors?: string[]`, `repairedJson?: string`)

### `POST /api/utils/json/repair`

Attempts to repair a malformed JSON string.

**Request Body**
`JsonInputDto` (contains `json` string)

**Response**
`JsonOutputDto` (contains `valid: boolean`, `errors?: string[]`, `repairedJson?: string`)

### `GET /api/auth/google`

Initiates Google OAuth2 login flow.

### `GET /api/auth/google/callback`

Handles Google OAuth2 callback, issues JWT.

### `GET /api/auth/github`

Initiates GitHub OAuth2 login flow.

### `GET /api/auth/github/callback`

Handles GitHub OAuth2 callback, issues JWT.

### `GET /api/auth/me`

Retrieves current authenticated user's profile.

### `POST /api/auth/logout`

Logs out the current user by clearing the authentication cookie.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory of this application (`apps/json-fix-validator`).

```ini
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:3000

# Google OAuth Credentials (for backend)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# GitHub OAuth Credentials (for backend)
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

- `VITE_API_URL`: The base URL of your NestJS backend API. This is used for proxying API requests during development.
- `VITE_FRONTEND_URL`: The base URL of this frontend application. Used by the backend for OAuth redirects.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: Google OAuth 2.0 credentials and callback URL. `GOOGLE_CALLBACK_URL` must match what's configured in Google Cloud Console.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`: GitHub OAuth credentials and callback URL. `GITHUB_CALLBACK_URL` must match what's configured in GitHub OAuth Apps.

---

## 📊 Roadmap

- [ ] Add more advanced JSON editing features (e.g., collapsible sections, syntax highlighting).
- [ ] Implement live validation as user types.
- [ ] Allow uploading JSON/schema files.
- [ ] History of previous validations/repairs.

---

## 🤝 Contributing

Contributions are welcome!

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🙌 Acknowledgements

- [Material-UI](https://mui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Nanostores](https://nanostores.github.io/)
