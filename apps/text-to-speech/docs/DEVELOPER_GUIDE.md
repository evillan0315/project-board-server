# Developer Guide

This guide is for developers who want to understand, contribute to, or extend the Google Gemini TTS & AI Code Planner frontend application.

## 1. Project Setup

Refer to the [Getting Started section in README.md](../README.md#getting-started) for initial setup, prerequisites, and installation instructions.

### 1.1 Environment Variables

Ensure your `.env` file in `apps/text-to-speech` is correctly configured:

```env
VITE_APP_API_BASE_URL=http://localhost:5000/api # URL of the backend API
VITE_FRONTEND_PORT=3003 # Port for OAuth callbacks
VITE_BASE_DIR=/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/text-to-speech # ABSOLUTE path to THIS project's root for AI Planner
VITE_PREVIEW_APP_URL=http://localhost:3002 # (Optional) URL for Vite preview if different
```

**`VITE_BASE_DIR` Importance**: This variable is critical for the AI Code Planner. It tells the backend the absolute path to your local `text-to-speech` project, allowing the AI to scan relevant files and apply changes. **Change this to your actual project path.**

### 1.2 Linting & Formatting

The project uses ESLint and Prettier for code quality and consistency.

*   **Lint:** `pnpm run lint`
*   **Fix Linting Issues:** `pnpm run lint:fix`
*   **Format Code:** `pnpm run format`

It's recommended to integrate these tools with your IDE (e.g., VS Code extensions for ESLint and Prettier).

## 2. Architecture Overview

The frontend is a single-page application (SPA) built with React and Vite. It communicates with a NestJS backend for authentication, TTS, and AI Planner functionalities.

*   **Technology Stack**:
    *   **React 18**: UI Library for building user interfaces.
    *   **Vite**: Fast build tool and development server.
    *   **TypeScript**: Statically typed JavaScript for enhanced code quality.
    *   **Material UI v6**: Comprehensive React UI component library.
    *   **Tailwind CSS v4**: Utility-first CSS framework for responsive design.
    *   **Nanostores**: Small, fast, and simple state management library.
    *   **React Router DOM v6**: For client-side routing.
    *   **Axios**: Promise-based HTTP client for API requests.
    *   **path-browserify**: Polyfill for Node.js `path` module for browser compatibility.

### 2.1 Project Structure

Refer to the [Project Structure in README.md](../README.md#project-structure) for a high-level overview of directories and their contents. Key directories include:

*   `src/api`: Centralized location for all API service calls (e.g., `authService.ts`, `geminiTtsService.ts`, `plannerService.ts`).
*   `src/components`: Reusable UI components.
    *   `src/components/planner`: Houses the complex AI Planner components, stores, and related logic.
*   `src/pages`: Top-level components mapped to routes by React Router.
*   `src/stores`: Nanostores for application-wide state (e.g., `authStore.ts`, `ttsStore.ts`, `themeStore.ts`, `plannerStore.ts`).
*   `src/hooks`: Custom React hooks for encapsulating reusable logic.
*   `src/types`: Global TypeScript interface and type definitions.
*   `src/theme`: Material UI theme configuration.

## 3. State Management with Nanostores

Nanostores is used for global state management due to its simplicity and performance.

*   **Atoms**: State is stored in `atom`s, which are simple observable objects.
    *   Example: `authStore.ts` manages authentication state (`isLoggedIn`, `token`, `user`).
*   **Actions**: Functions that modify an atom's state. They are typically co-located with the store definition.
    *   Example: `loginUser`, `logoutUser`, `fetchUserProfile` in `authStore.ts`.
*   **Hooks**: `useStore` from `@nanostores/react` is used in components to subscribe to and read store values.
    *   Example: `const { isLoggedIn, user } = useStore(authStore);`

**Best Practices:**
*   Define interfaces for store states at the top of the file.
*   Keep store logic (atom definition, actions) in separate `*.ts` files within the `stores` directory (or feature-specific `stores` directory like `planner/stores`).
*   Use selector functions (like `getAuthToken()`) for computed state or to prevent direct store access outside of explicit actions.

## 4. Styling (Material UI & Tailwind CSS)

The project combines Material UI for components and Tailwind CSS for utility-first styling.

*   **Material UI (`@mui/material`)**:
    *   Used for structural UI components (Buttons, TextFields, Cards, AppBars, etc.).
    *   The global theme is defined in `src/theme/index.ts`.
    *   The `sx` prop is used for custom styling within MUI components. **Rule**: Avoid inline `sx` objects; define `sx` constants or functions at the top of the component file for maintainability.
*   **Tailwind CSS (`@tailwindcss/vite`)**:
    *   Used for layout, spacing, flexbox, grid, and other utility-first styling.
    *   Integrated via Vite and configured in `tailwind.config.js`.
    *   Classes are applied directly to elements using the `className` prop.
    *   **Rule**: Prefer Tailwind for layout and basic styling; use MUI's `sx` for component-specific overrides or theme-dependent styles.

## 5. API Interaction

All API interactions are encapsulated in services within the `src/api` and `src/components/planner/api` directories.

*   **Axios**: The `axios` library is used for making HTTP requests.
*   **Authentication**:
    *   `authService.ts` handles user login, logout, and profile fetching.
    *   `getAuthToken()` from `authStore.ts` provides the JWT token for authenticated requests.
    *   All authenticated requests include `Authorization: Bearer <token>` in their headers.
*   **Error Handling**: Services implement try-catch blocks to handle `axios` errors and provide meaningful messages to the UI.

## 6. Routing (React Router DOM)

Client-side routing is handled by `react-router-dom`.

*   Routes are defined in `src/App.tsx`.
*   The `Layout` component wraps all routes to provide a consistent header and basic structure.
*   `Link` and `useNavigate` are used for navigation.

## 7. Adding New Features

1.  **Understand the Architecture**: Familiarize yourself with the existing project structure and patterns.
2.  **Create API Services**: If interacting with a new backend endpoint, create or extend a service in `src/api` (or `src/components/planner/api` for planner-related features).
3.  **Define Types**: Create or update TypeScript interfaces/types in `src/types` or `src/components/planner/types`.
4.  **Manage State**: For global or complex feature state, consider a new Nanostore in `src/stores` (or `src/components/planner/stores`).
5.  **Build Components**: Create functional React components for your UI in `src/components` or `src/pages`.
6.  **Update Routing**: Add new routes to `src/App.tsx` if necessary.
7.  **Test**: Manually test your new feature and consider adding automated tests (though not currently implemented in this project).

## 8. Contribution Guidelines

Please refer to the [CONTRIBUTING.md](../CONTRIBUTING.md) file for detailed contribution guidelines, including branching strategy, commit message conventions, and pull request process.

## 9. Troubleshooting

*   **Authentication Errors**:
    *   Ensure your `VITE_APP_API_BASE_URL` in `.env` is correct.
    *   Verify backend is running and accessible.
    *   Check backend console for any OAuth or JWT-related errors.
    *   Ensure OAuth callback URLs are correctly configured in both frontend and backend `.env` files.
*   **AI Code Planner Errors**:
    *   Verify `VITE_BASE_DIR` in your frontend `.env` is the correct **absolute path** to your `text-to-speech` project root. This is the most common issue.
    *   Check if the backend `project-board-server` is running and its own `.env` is configured correctly for AI model access.
    *   Review the AI Instructions and Expected Output Format in the drawers for any syntax errors or inconsistencies.
*   **"Root element with ID 'root' not found"**: Ensure your `index.html` has `<div id="root"></div>`.
*   **Styling Issues**: Check `tailwind.config.js` and `src/index.css` for proper Tailwind integration. For MUI issues, inspect the theme in `src/theme/index.ts`.
*   **Dependencies**: Run `pnpm install` if you encounter module not found errors.
