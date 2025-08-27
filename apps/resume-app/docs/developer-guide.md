# Developer Guide: Resume AI Assistant - Frontend

This guide provides an in-depth look at the frontend architecture, development setup, and key concepts of the Resume AI Assistant. It's intended for developers looking to understand, modify, or contribute to the project.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Key Concepts](#key-concepts)
  - [State Management (Nanostores)](#state-management-nanostores)
  - [API Integration](#api-integration)
  - [UI Components (MUI & Tailwind)](#ui-components-mui--tailwind)
  - [Authentication Flow](#authentication-flow)
- [Styling](#styling)
- [Linting and Formatting](#linting-and-formatting)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)

## Project Overview

This repository contains the frontend application for the Resume AI Assistant. It's a single-page application (SPA) built with React and TypeScript, providing a user interface to interact with a separate AI-powered backend service. The application allows users to upload/input resumes, optimize them against job descriptions, generate new resumes, and enhance existing content.

## Tech Stack

- **React 19**: Frontend library for building UIs.
- **TypeScript**: Adds static typing to JavaScript for improved code quality and maintainability.
- **Vite**: A blazing-fast build tool and development server.
- **Tailwind CSS v4 (upcoming)**: Utility-first CSS framework for rapid UI development.
- **Material-UI (MUI)**: A comprehensive React UI library, integrated with Tailwind for styling flexibility.
- **nanostores**: A minimalist, high-performance state management library.
- **react-router-dom**: For client-side routing.

## Project Structure

```
resume-app/
├── public/
├── src/
│   ├── api/                   # API client functions for backend communication
│   │   └── resumeApi.ts
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Generic UI elements (Button, TextField etc.)
│   │   └── (feature-specific) # Components related to specific app sections
│   ├── pages/                 # Top-level components for different routes
│   ├── services/              # Business logic, e.g., authService
│   ├── stores/                # Global state management using nanostores
│   │   ├── authStore.ts
│   │   └── resumeStore.ts
│   ├── types/                 # TypeScript type definitions (interfaces, enums)
│   │   ├── auth.ts
│   │   └── resume.ts
│   ├── App.tsx                # Main application component and routing setup
│   ├── index.css              # Global styles, Tailwind CSS import
│   ├── main.tsx               # Entry point for React app
│   └── routes/                # (Optional) Centralized route definitions
├── .env                       # Environment variables (local)
├── eslint.config.ts           # ESLint configuration
├── index.html                 # Main HTML file
├── package.json               # Project dependencies and scripts
├── tsconfig.*.json            # TypeScript configurations
├── vite.config.ts             # Vite build tool configuration
└── yarn.lock                  # Yarn dependency lock file
```

### Directories Explanation:

- `src/api`: Contains functions that wrap `fetch` calls to the backend API endpoints. These abstract away the network request details.
- `src/components`: Houses all presentational and logical components that are reusable across the application. `ui/` subdirectory specifically for generic, atomic UI elements.
- `src/pages`: Represents the main views of the application, composed of multiple components.
- `src/services`: Contains higher-level business logic that might involve multiple API calls or complex state transformations, e.g., `authService.ts` for authentication flows.
- `src/stores`: Manages the global application state using `nanostores`. Each store (`authStore`, `resumeStore`) is responsible for a specific domain of state.
- `src/types`: Centralized location for all TypeScript interfaces and types, ensuring type safety across the application.

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v18.x or higher recommended)
- [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/)
- Git

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/evillan0315/resume-app.git
    cd resume-app
    ```

2.  **Install dependencies**:
    ```bash
    yarn install
    # or
    npm install
    ```

### Environment Variables

Create a `.env` file in the root of the project to configure API endpoints and OAuth credentials. These values are crucial for the application to function correctly.

```dotenv
# API Base URL for the backend
VITE_API_URL=http://localhost:3000

# Frontend URL (used for OAuth redirects from backend)
VITE_FRONTEND_URL=http://localhost:3001

# Google OAuth credentials (get these from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET # Not directly used by frontend, but good to have if needed for reference
VITE_GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback # Must match backend and Google Console

# GitHub OAuth credentials (get these from GitHub OAuth Apps)
VITE_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
VITE_GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET # Not directly used by frontend
VITE_GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback # Must match backend and GitHub OAuth settings
```

> **Important**: Ensure your backend service is running and configured correctly to handle requests from this frontend application and to provide the necessary OAuth callbacks.

### Running the Application

To start the development server:

```bash
yarn dev
# or
npm run dev
```

The application will be accessible at `http://localhost:3001` (or the port specified in your `vite.config.ts`).

## Key Concepts

### State Management (Nanostores)

`nanostores` is used for lightweight, atomic state management. Key principles:

- **Small, focused stores**: Each store manages a specific part of the application state (e.g., `authStore` for user authentication, `resumeStore` for resume data and loading states).
- **`map`**: Used for objects that need multiple keys, allowing fine-grained updates.
- **`useStore` hook**: From `@nanostores/react`, this hook subscribes React components to store changes and re-renders when relevant data updates.
- **Actions**: Functions that modify store state are defined alongside the store, promoting a clear separation of concerns.

### API Integration

- **`src/api/resumeApi.ts`**: Contains functions for interacting with the `/api/resume` endpoints (parse, optimize, generate, enhance). It includes error handling and ensures proper `Content-Type` headers for different request types (JSON, FormData).
- **`src/services/authService.ts`**: Handles authentication-related API calls like `/api/auth/me` (to check status) and `/api/auth/logout`. It integrates directly with `authStore` to update the application's authentication state.
- **Proxy in `vite.config.ts`**: Development server proxies `/api` and `/socket.io` requests to the `VITE_API_URL` to avoid CORS issues during development.

### UI Components (MUI & Tailwind)

- The application uses Material-UI components for standard UI elements (Buttons, TextFields, Progress indicators).
- Tailwind CSS v4 is integrated to provide utility-first styling. MUI components are customized using Tailwind classes directly via the `className` prop, enabling a unified design system.
- Custom components like `Button.tsx` and `TextField.tsx` in `src/components/ui` wrap MUI components to apply default styles (e.g., `!normal-case` for buttons) and ensure consistency.

### Authentication Flow

- **OAuth (Google/GitHub)**: The primary authentication method. The frontend initiates the OAuth flow by redirecting to a backend endpoint (`/api/auth/google`, `/api/auth/github`).
- **HTTP-only Cookies**: The backend sets an `accessToken` as an HTTP-only cookie upon successful OAuth login. This cookie is automatically sent by the browser with subsequent API requests, enhancing security.
- **`checkAuthStatus`**: Called on application load (`src/components/Layout.tsx`) to verify if a user is already authenticated by calling the backend's `/api/auth/me` endpoint. The response updates `authStore`.
- **`authStore`**: Manages `isLoggedIn`, `user` profile, `loading` state, and `error` messages related to authentication.

## Styling

- Global styles are defined in `src/index.css`, primarily importing Tailwind CSS.
- Tailwind classes are used extensively across all components for styling.
- MUI components are overridden where necessary using `sx` prop or by applying Tailwind classes to their root elements (e.g., `className="!bg-blue-600"`). The `!` prefix in Tailwind classes is used to ensure they override MUI's default styles.

## Linting and Formatting

- **ESLint**: Configured (`eslint.config.ts`) with `typescript-eslint` and `eslint-plugin-react` to enforce coding standards and catch potential issues.
- **TypeScript**: Strict mode is enabled in `tsconfig.json` for robust type checking.

## Building for Production

To create a production-ready build of the frontend application:

```bash
yarn build
# or
npm run build
```

This command will compile the TypeScript code and bundle the assets into the `dist/` directory, which can then be served by a static file server or integrated with the backend.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1.  Fork the [repository](https://github.com/evillan0315/resume-app).
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Ensure all tests pass and linting rules are followed.
5.  Submit a pull request.
