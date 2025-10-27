# Google Gemini Text-to-Speech Frontend: Developer Guide

This document provides a comprehensive guide for developers working with the Google Gemini Text-to-Speech (TTS) frontend application. It covers architecture, setup, development practices, and integration details.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Key Features](#2-key-features)
3.  [Technologies Used](#3-technologies-used)
4.  [Project Structure](#4-project-structure)
5.  [Getting Started](#5-getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Configuration](#configuration)
    *   [Running the Application](#running-the-application)
    *   [Building for Production](#building-for-production)
6.  [Architecture & Design](#6-architecture--design)
    *   [State Management (Nanostores)](#state-management-nanostores)
    *   [API Interaction (Axios)](#api-interaction-axios)
    *   [Authentication Flow](#authentication-flow)
    *   [UI/Styling (Material UI & Tailwind CSS)](#uistyling-material-ui--tailwind-css)
    *   [Routing (React Router DOM)](#routing-react-router-dom)
7.  [Backend Integration](#7-backend-integration)
8.  [Customization](#8-customization)
9.  [Linting & Formatting](#9-linting--formatting)
10. [Deployment](#10-deployment)
11. [Future Enhancements / Roadmap](#11-future-enhancements--roadmap)

---

## 1. Introduction

The Google Gemini TTS Generator Frontend is a React/Vite application designed to provide a user-friendly interface for interacting with a Google Gemini Text-to-Speech backend service. It enables users to convert text into speech, configure multiple speakers with distinct voices, and manage language settings, all while offering robust authentication capabilities.

## 2. Key Features

*   **Robust Authentication:** Seamless integration with JWT-based authentication, Google OAuth2, and GitHub OAuth2 provided by the associated backend server.
*   **Dynamic Text Input:** Accepts arbitrary text input for synthesis, supporting multi-line and structured content.
*   **Flexible Multi-Speaker Configuration:** Allows dynamic addition/removal of speaker profiles, enabling specification of AI prompt speaker names and corresponding Google voice names (e.g., 'Kore', 'Puck').
*   **Language Localization:** Supports setting the `languageCode` for speech output, defaulting to 'en-US'.
*   **Integrated Audio Playback:** Streams and plays the generated `.wav` audio file directly within the browser, offering standard controls.
*   **Comprehensive Feedback:** Implements visual loading states and detailed error handling mechanisms during API interactions.

## 3. Technologies Used

*   **React**: A declarative, component-based JavaScript library for building user interfaces.
*   **Vite**: A next-generation frontend tooling that provides an extremely fast development experience and optimized build process.
*   **TypeScript**: A superset of JavaScript that adds static types, enhancing code quality, maintainability, and developer experience.
*   **Material UI (MUI v6)**: A comprehensive React UI component library based on Google's Material Design. Used for consistent, accessible, and aesthetically pleasing UI elements.
*   **Tailwind CSS (v4)**: A utility-first CSS framework for rapidly building custom designs without leaving your HTML/JSX. Used primarily for layout, spacing, and responsive design.
*   **Nanostores**: A minimalist, performant, and testable state management library. Utilized for global application state like authentication, theme, and TTS generation parameters.
*   **Axios**: A popular promise-based HTTP client for making API requests to the backend server.
*   **React Router DOM (v6)**: A standard library for declarative routing in React applications, managing navigation between different views.
*   **ESLint & Prettier**: Integrated for code linting, static analysis, and consistent code formatting across the project.

## 4. Project Structure

The application follows a modular and feature-sliced structure within the `src` directory:

```
src/
├── api/                  # Services for interacting with backend API endpoints
│   ├── authService.ts    # Functions for authentication-related API calls
│   └── geminiTtsService.ts # Functions for Google Gemini TTS API calls
├── App.tsx               # Main application component, handles routing
├── components/           # Reusable UI components
│   ├── Layout.tsx        # Provides a consistent page layout (e.g., Navbar, main content area)
│   └── ThemeToggle.tsx   # Component to switch between light/dark themes
├── hooks/                # Custom React hooks for encapsulating logic
│   └── useAuth.ts        # Hook for managing authentication state and actions
├── index.css             # Global CSS styles (likely includes Tailwind base styles)
├── main.tsx              # Entry point of the React application
├── pages/                # Top-level components representing distinct application views
│   ├── AuthCallback.tsx  # Handles OAuth2 redirects and token processing
│   ├── LoginPage.tsx     # User login interface
│   └── TtsGeneratorPage.tsx # Main page for text-to-speech generation
├── stores/               # Nanostores for global state management
│   ├── authStore.ts      # Manages user authentication status and data
│   ├── themeStore.ts     # Manages application theme (light/dark)
│   └── ttsStore.ts       # Manages state related to TTS generation (text, speakers, audio)
├── theme/                # Material UI theme configuration
│   └── index.ts          # Defines custom MUI palette, typography, etc.
├── types/                # TypeScript type definitions and interfaces
│   ├── auth.ts           # Types for authentication data (user, tokens)
│   └── tts.ts            # Types for TTS requests and responses (speakers, voices)
└── vite-env.d.ts         # Vite-specific environment type declarations
```

## 5. Getting Started

This section details how to set up, run, and build the application for development and production environments.

### Prerequisites

*   **Node.js**: Version 18 or higher.
*   **pnpm**: Recommended package manager. Install with `npm install -g pnpm`.
*   **Backend Server**: The associated backend server (`project-board-server`) must be running and accessible, typically at `http://localhost:3000`, with its authentication and Google TTS modules configured.

### Installation

1.  **Clone the repository**: If you haven't already, clone the mono-repository:
    ```bash
    git clone https://github.com/evillan0315/project-board-server.git
    cd project-board-server
    ```
2.  **Navigate to the frontend application directory**:
    ```bash
    cd apps/text-to-speech
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```
4.  **Initialize Tailwind CSS**:
    ```bash
    pnpm run tailwind:init
    ```

### Configuration

Create a `.env` file in the `apps/text-to-speech` directory for local development.

```env
VITE_APP_API_BASE_URL=http://localhost:3000
```

*   `VITE_APP_API_BASE_URL`: This environment variable specifies the base URL of your backend API. Ensure it matches the address where your `project-board-server` is running.

#### Backend OAuth Configuration

For Google and GitHub OAuth to function correctly, ensure the backend's (`project-board-server/.env`) OAuth callback URLs are configured to point to this frontend application's `AuthCallback` route. The frontend's default callback route is `/auth/callback`.

Example backend `.env` configuration:

```env
# ... other backend configs

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID='your_google_client_id'
GOOGLE_CLIENT_SECRET='your_google_client_secret'
GOOGLE_CALLBACK_URL='http://localhost:3002/auth/callback' # Must match this frontend's callback route

# GitHub OAuth2 Credentials
GITHUB_CLIENT_ID='your_github_client_id'
GITHUB_CLIENT_SECRET='your_github_client_secret'
GITHUB_CALLBACK_URL='http://localhost:3002/auth/callback' # Must match this frontend's callback route

# Frontend URL reference for backend redirects
FRONTEND_URL='http://localhost:3002'
```

The `vite.config.ts` configures the development server to run on `port: 3002`. It is crucial that the `FRONTEND_URL` and OAuth callback URLs specified in the backend's `.env` match this actual running port (e.g., `http://localhost:3002`).

### Running the Application

To start the development server:

```bash
pnpm run dev
```

This command will typically launch the application at `http://localhost:3002` (as configured in `vite.config.ts`). You can then navigate to `/login` to authenticate.

### Building for Production

To compile the application for production deployment:

```bash
pnpm run build
```

The compiled assets will be generated in the `dist/` directory, ready for static serving.

## 6. Architecture & Design

### State Management (Nanostores)

Nanostores is used for lightweight and efficient global state management. Key stores include:

*   `stores/authStore.ts`: Manages the user's authentication status, token (if applicable), and user profile information. It includes logic for setting login/logout states.
*   `stores/themeStore.ts`: Controls the application's theme preference (light or dark mode) and persists it.
*   `stores/ttsStore.ts`: Holds the state for the TTS generation page, including the input text, configured speakers, selected language code, and the generated audio blob.

Components interact with these stores using the `@nanostores/react` hook `useStore`.

### API Interaction (Axios)

`axios` is configured for making HTTP requests to the backend.

*   `api/authService.ts`: Contains functions for user authentication, such as `login`, `logout`, `googleAuth`, `githubAuth`, and `getMe`. It handles setting and clearing authentication cookies or headers.
*   `api/geminiTtsService.ts`: Provides the `generateSpeech` function, responsible for sending the text, speaker configurations, and language code to the backend TTS endpoint. It handles the binary audio response.

The `axios` instance is likely configured with `withCredentials: true` in `authService` to handle `httpOnly` cookies from the NestJS backend.

### Authentication Flow

1.  **Login Page (`pages/LoginPage.tsx`)**: Presents options for email/password login, Google OAuth, and GitHub OAuth.
2.  **OAuth Initiation**: Clicking Google/GitHub buttons redirects the user to the backend's respective OAuth initiation endpoint (`/api/auth/google`, `/api/auth/github`). The backend then redirects to the OAuth provider.
3.  **OAuth Callback (`pages/AuthCallback.tsx`)**: After successful authentication with the OAuth provider, the user is redirected back to the frontend's `/auth/callback` route. This page extracts any relevant authentication tokens/data from the URL (e.g., query parameters), sends them to the backend for verification/session establishment, and then updates the `authStore` before redirecting the user to the main application page.
4.  **Session Management**: The backend typically sets an `httpOnly` cookie upon successful login. Subsequent authenticated requests automatically include this cookie. The `authStore` maintains a client-side representation of the user's logged-in status.
5.  **`hooks/useAuth.ts`**: A custom hook centralizing authentication logic, providing access to `authStore` state and methods for login/logout actions across components.

### UI/Styling (Material UI & Tailwind CSS)

The application utilizes a hybrid approach for styling:

*   **Material UI (MUI)**: Provides core UI components (buttons, text fields, app bars, dialogs, etc.) with a consistent Material Design aesthetic. The theme is customized in `src/theme/index.ts` to align with project branding and provide dark/light mode support.
*   **Tailwind CSS**: Used for low-level utility classes, particularly for layout (flexbox, grid), spacing (padding, margin), positioning, and responsive adjustments. Tailwind classes are applied directly in JSX using `className`.
*   **`sx` Prop**: For MUI components, the `sx` prop is used for custom styling that leverages MUI's theming capabilities, often defined as constants at the top of files for maintainability.
*   **Theme Toggle**: The `components/ThemeToggle.tsx` component allows users to switch between light and dark themes, managed by `stores/themeStore.ts`.

### Routing (React Router DOM)

`React Router DOM v6` manages navigation.

*   `App.tsx`: Defines the main routes, including protected routes (requiring authentication) and public routes (login, callback).
*   `Layout.tsx`: Acts as a wrapper for most pages, providing common elements like a header, navigation, and theme toggle.

## 7. Backend Integration

This frontend is designed to work with a NestJS backend (likely `project-board-server`) and interacts with the following REST API endpoints:

*   `POST /api/auth/login`: Authenticates user with email and password.
*   `POST /api/auth/logout`: Invalidates the server-side session/cookie.
*   `GET /api/auth/google`: Initiates Google OAuth2 login flow.
*   `GET /api/auth/github`: Initiates GitHub OAuth2 login flow.
*   `GET /api/auth/me`: Fetches the profile of the currently authenticated user.
*   `POST /api/google-tts/generate`: **Primary TTS generation endpoint.**
    *   **Description:** Generates speech audio from text using Google Gemini's TTS model, supporting multiple speakers and language codes.
    *   **Request Body (JSON):**
        ```json
        {
          "prompt": "Eddie: AI is changing everything!\nMarionette: And it's influencing fashion too.",
          "speakers": [
            { "speaker": "Eddie", "voiceName": "en-US-Studio-F" },
            { "speaker": "Marionette", "voiceName": "en-US-Studio-B" }
          ],
          "languageCode": "en-US" // Optional, defaults to backend's configured default if not provided
        }
        ```
    *   **Response:** A binary `.wav` audio file stream (`application/octet-stream` or `audio/wav` content type). The frontend handles this by creating a `Blob` and then a `URL` for the `audio` element.

## 8. Customization

*   **Material UI Theme**: Modify `src/theme/index.ts` to adjust colors, typography, spacing, and other design tokens to match brand guidelines.
*   **Tailwind CSS**: Customize `tailwind.config.js` for extending Tailwind's default utility classes, defining custom components, or adding new design system elements.
*   **API Endpoints**: If the backend API routes change, update the `VITE_APP_API_BASE_URL` in `.env` and the specific paths within `src/api/*.ts` files.
*   **Voice Names**: The `voiceName` values in speaker configurations are dependent on the voices supported by your Google Gemini TTS setup and exposed by the backend. Refer to Google's official documentation or your backend service's configuration for a list of valid voice names.
*   **Language Codes**: Add or modify available language codes within the `TtsGeneratorPage.tsx` or related `ttsStore` if the backend supports additional languages.

## 9. Linting & Formatting

The project enforces code quality and consistency using ESLint and Prettier.

*   **ESLint (`eslint.config.ts`)**: Configured for TypeScript, React, and React Hooks. It uses `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-unused-imports` for comprehensive static analysis.
    *   `pnpm run lint`: Runs ESLint to check for issues.
    *   `pnpm run lint:fix`: Automatically fixes fixable ESLint issues.
*   **Prettier**: Integrated with ESLint (`eslint-plugin-prettier` and `eslint-config-prettier`) to ensure consistent code formatting.
    *   `pnpm run format`: Formats all `.ts` and `.tsx` files in the `src` directory.

The `eslint.config.ts` explicitly disables `react/react-in-jsx-scope` due to React 17+ JSX transform, `react/prop-types` (TypeScript handles this), and `typescript-eslint/no-unused-vars` in favor of `eslint-plugin-unused-imports`.

## 10. Deployment

Refer to the following dedicated documentation files for deployment instructions:

*   `docs/DEPLOYMENT.md`: General deployment guidelines for the application.
*   `docs/VERCEL_GITHUB_ACTIONS.md`: Specific instructions for deploying to Vercel using GitHub Actions.

## 11. Future Enhancements / Roadmap

*   **User Profiles**: Expand user profile management beyond basic authentication.
*   **Saved Generations**: Allow users to save generated audio files or text prompts for later use.
*   **Advanced Voice Customization**: Expose more Google Gemini TTS parameters (e.g., speaking rate, pitch, SSML support).
*   **Error Logging & Monitoring**: Integrate with client-side error tracking tools.
*   **Internationalization (i18n)**: Support multiple UI languages.
*   **Integration Tests**: Implement end-to-end and integration tests to ensure system stability.
