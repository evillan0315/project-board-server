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
  - [Material Icons](#material-icons)
  - [Authentication Flow](#authentication-flow)
- [Styling](#styling)
- [Linting and Formatting](#linting-and-formatting)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)

## Project Overview

This repository contains the frontend application for the Resume AI Assistant. It's a single-page application (SPA) built with React and TypeScript, providing a user interface to interact with a separate AI-powered backend service. The application allows users to upload/input resumes, optimize them against job descriptions, generate new resumes, enhance existing content, generate portfolio webpages, and create tailored cover letters, with options to export all generated documents.

## Tech Stack

- **React 19**: Frontend library for building UIs.
- **TypeScript**: Adds static typing to JavaScript for improved code quality and maintainability.
- **Vite**: A blazing-fast build tool and development server.
- **Tailwind CSS v4 (upcoming)**: Utility-first CSS framework for rapid UI development.
- **Material-UI (MUI) v6**: A comprehensive React UI library, integrated with Tailwind for styling flexibility.
- **Material Icons v6**: A rich set of icons from Material Design, used across the application.
- **nanostores**: A minimalist, high-performance state management library.
- **react-router-dom v6**: For client-side routing.

## Project Structure

```
resume-app/
├── public/
├── src/
│   ├── api/                   # API client functions for backend communication
│   │   ├── resumeApi.ts       # Functions for resume-related AI operations
│   │   └── utilsApi.ts        # Functions for utility operations like document export
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Generic UI elements (Button, TextField, ThemeSwitcher etc.)
│   │   └── (feature-specific) # Components related to specific app sections (e.g., ResumeForm, DocumentExportSection)
│   ├── pages/                 # Top-level components for different routes (e.g., ResumeGeneratorPage, LoginPage)
│   ├── services/              # Business logic, e.g., authService for authentication flows
│   ├── stores/                # Global state management using nanostores
│   │   ├── authStore.ts       # Manages user authentication state
│   │   ├── resumeStore.ts     # Manages resume content, AI results, and loading states
│   │   └── themeStore.ts      # Manages UI theme (light/dark) state
│   ├── types/                 # TypeScript type definitions (interfaces, enums)
│   │   ├── auth.ts            # Types related to user authentication
│   │   └── resume.ts          # Types related to resume operations and AI results
│   ├── theme/                 # Material-UI theme configuration
│   │   └── index.ts
│   ├── App.tsx                # Main application component and routing setup
│   ├── index.css              # Global styles, Tailwind CSS import
│   ├── main.tsx               # Entry point for React app
│   └── routes/                # (Optional) Centralized route definitions (currently minimal)
├── .env                       # Environment variables (local)
├── eslint.config.ts           # ESLint configuration
├── index.html                 # Main HTML file
├── package.json               # Project dependencies and scripts
├── tsconfig.*.json            # TypeScript configurations
├── vite.config.ts             # Vite build tool configuration
└── yarn.lock                  # Yarn dependency lock file
```

### Directories Explanation:

- `src/api`: Contains functions that wrap `fetch` calls to the backend API endpoints. These abstract away the network request details, including multipart form data for file uploads and JSON for other requests.
- `src/components`: Houses all presentational and logical components that are reusable across the application. `ui/` subdirectory specifically for generic, atomic UI elements that wrap Material-UI components with custom defaults and Tailwind styling.
- `src/pages`: Represents the main views of the application, composed of multiple components (e.g., `ResumeGeneratorPage` orchestrates various AI features).
- `src/services`: Contains higher-level business logic that might involve multiple API calls or complex state transformations, e.g., `authService.ts` for authentication flows.
- `src/stores`: Manages the global application state using `nanostores`. Each store (`authStore`, `resumeStore`, `themeStore`) is responsible for a specific domain of state, enabling reactivity and separation of concerns.
- `src/types`: Centralized location for all TypeScript interfaces and types, ensuring type safety across the entire application for data structures and API contracts.

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

# Frontend URL (used for OAuth redirects from backend). Must match the port Vite runs on.
VITE_FRONTEND_URL=http://localhost:3001

# Google OAuth credentials (get these from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET # Not directly used by frontend; primarily for backend reference
VITE_GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback # Must match backend and Google Console

# GitHub OAuth credentials (get these from GitHub OAuth Apps)
VITE_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
VITE_GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET # Not directly used by frontend; primarily for backend reference
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

-   **Small, focused stores**: Each store manages a specific part of the application state (e.g., `authStore` for user authentication, `resumeStore` for resume data, loading, and errors, `themeStore` for theme preference).
-   **`map`**: Used for objects that need multiple keys, allowing fine-grained updates (e.g., `resumeStore.setKey('loading', { ...$resume.loading, parse: true })`).
-   **`useStore` hook**: From `@nanostores/react`, this hook subscribes React components to store changes and re-renders when relevant data updates.
-   **Actions/Mutations**: Functions (e.g., `loginSuccess`, `resetErrors`) are defined alongside the store to encapsulate state modification logic, promoting a clear separation of concerns and maintainability.

### API Integration

-   **`src/api/resumeApi.ts`**: Contains functions for interacting with the `/api/resume` endpoints (parse, optimize, generate, enhance, generate portfolio, generate cover letter). It includes robust error handling and ensures proper `Content-Type` headers for different request types (JSON, FormData for file uploads).
-   **`src/api/utilsApi.ts`**: Handles utility API calls, specifically for document export/conversion (`/api/utils` endpoints). It integrates `file-saver` for client-side file downloads.
-   **`src/services/authService.ts`**: Handles authentication-related API calls like `/api/auth/me` (to check status) and `/api/auth/logout`. It integrates directly with `authStore` to update the application's authentication state.
-   **Proxy in `vite.config.ts`**: The Vite development server proxies `/api` and `/socket.io` requests to the `VITE_API_URL` (the backend) to effectively bypass CORS issues during development.

### UI Components (MUI & Tailwind)

-   The application primarily uses **Material-UI v6** components for standard UI elements (Buttons, TextFields, Progress indicators, Tabs, etc.), ensuring accessibility and a consistent design system.
-   **Tailwind CSS v4** is integrated to provide utility-first styling for layout, spacing, colors, and responsive design. Tailwind classes are applied directly to MUI components via the `className` prop.
-   **MUI overrides with Tailwind**: When applying Tailwind classes to MUI components, the `!` prefix (e.g., `!bg-blue-600`) is frequently used to ensure Tailwind's utility styles override MUI's default or theme-based styles.
-   Custom wrapper components like `Button.tsx` and `TextField.tsx` in `src/components/ui` are used to apply default MUI props (e.g., `fullWidth`, `margin="normal"`) and ensure custom Tailwind classes (e.g., `!normal-case` for buttons) are consistently applied.

### Material Icons

-   **Material Icons v6** (`@mui/icons-material`) are used throughout the application to provide clear visual cues and enhance user experience. Icons are directly integrated into MUI components (e.g., `startIcon` prop on `Button`, or within `Typography` elements).

### Authentication Flow

-   **OAuth (Google/GitHub)**: The primary authentication method. The frontend initiates the OAuth flow by redirecting the user's browser to a backend endpoint (`/api/auth/google`, `/api/auth/github`).
-   **HTTP-only Cookies**: Upon successful OAuth login, the backend sets an `accessToken` as an HTTP-only cookie. This cookie is automatically sent by the browser with subsequent API requests to the same domain, enhancing security as JavaScript cannot access it directly.
-   **`checkAuthStatus`**: This service function is called on application load (`src/components/Layout.tsx`) to verify if a user is already authenticated. It calls the backend's `/api/auth/me` endpoint. The response (user profile or null) is used to update the `authStore` accordingly.
-   **`authStore`**: Manages the `isLoggedIn` status, the `user` profile object, a `loading` state to indicate ongoing authentication checks, and any `error` messages related to authentication.

## Styling

-   Global styles are primarily handled by importing Tailwind CSS in `src/index.css`.
-   MUI's theming capabilities (`src/theme/index.ts`) are used to define a consistent color palette, typography, and component default styles (e.g., `MuiButton`, `MuiTextField`). The theme supports light and dark modes.
-   Tailwind classes are leveraged for fine-grained control over layout (`flex`, `grid`, `padding`, `margin`), responsive behavior, and specific visual tweaks that complement or override MUI's defaults.
-   The `ThemeSwitcher` component in `src/components/ui` allows users to toggle between light and dark themes, with their preference stored in `localStorage` and managed by `themeStore`.

## Linting and Formatting

-   **ESLint**: Configured (`eslint.config.ts`) with `typescript-eslint` and `eslint-plugin-react` to enforce coding standards, identify potential issues, and maintain code quality.
-   **TypeScript**: Strict mode is enabled in `tsconfig.json` for robust type checking, which helps catch errors during development and improves code maintainability.

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
2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  Make your changes, ensuring clear commit messages.
4.  Ensure all tests pass and linting rules are followed (`npm run lint`).
5.  Submit a pull request to the `main` branch with a clear description of your changes.
