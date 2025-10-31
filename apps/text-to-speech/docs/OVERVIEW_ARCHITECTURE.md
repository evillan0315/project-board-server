# Overview and Architecture

This document provides a high-level overview of the `text-to-speech` frontend application's architecture, its core components, and how it interacts with the backend services.

## 1. High-Level Architecture

The `text-to-speech` application is a modern Single-Page Application (SPA) built using React and Vite. It serves as the user interface for two primary functionalities:
1.  **Google Gemini Text-to-Speech (TTS) Generation**: Converting text into speech audio.
2.  **AI Code Planning & Application**: Generating and applying code modifications based on natural language prompts.

It operates as a client that communicates with a separate NestJS backend server (likely part of the same monorepo, e.g., `project-board-server`).

```
+----------------+       HTTP/REST API       +-------------------------+
|                | <-----------------------> |                         |
|    Frontend    |                           |     Backend Server      |
| (React/Vite)   |                           |    (Node.js/NestJS)     |
|                |                           |                         |
| - UI Components|                           | - Auth Module           |
| - State Mgmt   |                           | - Google TTS Module     |
| - Routing      |                           | - AI Planner Module     |
| - API Clients  |                           | - Database (Prisma)     |
|                |                           | - File System Access    |
+----------------+                           +----------^--------------+
        ^                                               |
        |  OAuth Redirect (browser-based)               | Google Gemini,
        v                                               | other AI APIs
+----------------+      +------------------+            v
|                |      |                  |            +-----------+
| OAuth Providers|      | Local Filesystem | <--------> | AI Models |
| (Google, GitHub)|      |  (for AI Planner) |            +-----------+
+----------------+      +------------------+
```

## 2. Frontend Architecture (React/Vite)

The frontend is structured to be modular, maintainable, and scalable.

### 2.1 Core Technologies

*   **React 18**: The foundation for building interactive UI components.
*   **Vite**: A next-generation frontend tooling that provides an extremely fast development experience.
*   **TypeScript**: Ensures type safety across the entire codebase, reducing errors and improving code readability.
*   **Material UI v6**: A comprehensive UI component library, providing pre-built, accessible, and customizable components.
*   **Tailwind CSS v4**: Used alongside Material UI for utility-first styling, especially for layout, spacing, and responsive design.
*   **Nanostores**: A lightweight, performant state management library used for global application state.
*   **React Router DOM v6**: Manages client-side routing, enabling navigation between different application views.
*   **Axios**: A robust HTTP client for making API requests to the backend.

### 2.2 Key Modules & Data Flow

*   **`src/App.tsx`**: The main entry point, responsible for setting up the Material UI theme provider and React Router.
*   **`src/components/Layout.tsx`**: Provides the consistent application layout, including the `AppBar` (navigation, theme toggle, auth buttons) and a `main` content area where routes are rendered.
*   **`src/pages/`**: Contains page-level components that define the structure and logic for specific routes (e.g., `HomePage`, `TtsGeneratorPage`, `PlannerPage`).
*   **`src/stores/` (Nanostores)**:
    *   **`authStore.ts`**: Manages user authentication state (login status, JWT token, user profile). It also handles persistence of the JWT token in `localStorage`.
    *   **`ttsStore.ts`**: Manages the state for the TTS generator (prompt, speakers, language code, loading, error, audio URL).
    *   **`plannerStore.ts`**: Manages the state for the AI Code Planner (user prompt, project root, scan paths, generated plan, loading, error, apply status).
    *   **`themeStore.ts`**: Controls the application's light/dark theme.
    *   **`fileTreeStore.ts`**: A simple persistent store for the `projectRootDirectory`, ensuring it's remembered across sessions.
*   **`src/api/` (API Services)**:
    *   Encapsulates all communication with the backend.
    *   `authService.ts`: Handles login (email/password, Google/GitHub OAuth initiation), logout, and fetching user profile.
    *   `geminiTtsService.ts`: Handles requests to the backend's Google Gemini TTS endpoint.
    *   `src/components/planner/api/plannerService.ts`: Handles requests to the backend's AI Planner endpoints (generating and applying plans).
    *   These services abstract away `axios` calls and provide typed interfaces for data.
*   **`src/hooks/`**: Custom React hooks like `useAuth` simplify component logic by abstracting state management and side effects.
*   **Theming and Styling**:
    *   `src/theme/index.ts`: Defines the Material UI theme palette and typography.
    *   `src/index.css`: Imports Tailwind CSS and global CSS. Tailwind classes are used directly in JSX `className` attributes for utility-first styling and layout.
    *   Material UI's `sx` prop is used for component-specific styles, often defined as constants to avoid inline objects.

### 2.3 Authentication Flow

1.  **Initialization**: On app start, `authStore` checks `localStorage` for an existing JWT token. If found, it attempts to `fetchUserProfile`.
2.  **Login (Email/Password)**: User provides credentials, `authService.login` calls backend. Backend returns JWT and user profile. `authStore` updates, token stored in `localStorage`.
3.  **Login (OAuth)**: User clicks Google/GitHub button. Frontend redirects to backend OAuth endpoint. Backend initiates OAuth flow with provider, receives token, authenticates user, and redirects back to frontend's `/auth/callback` with JWT token as a URL parameter.
4.  **`AuthCallback.tsx`**: Extracts token, updates `authStore`, and fetches user profile. Redirects to `/` (homepage).
5.  **Token Usage**: For subsequent authenticated API calls (TTS, Planner), `getAuthToken()` from `authStore` is used to retrieve the JWT, which is then added to the `Authorization` header (`Bearer <token>`).

### 2.4 Google Gemini TTS Flow

1.  User enters `prompt`, configures `speakers` (name, voiceName), and `languageCode` on `TtsGeneratorPage`.
2.  On "Generate Speech" click, `ttsStore.generateSpeech` action is dispatched.
3.  This action calls `geminiTtsService.generateSpeech`, sending a `TtsRequestDto` to `POST /api/google-tts/generate`.
4.  The backend processes the request using Google Gemini's TTS API, converts the text, and returns an audio `Blob`.
5.  The frontend receives the `Blob`, creates a `URL` for it (`URL.createObjectURL`), and updates `ttsStore` with this URL.
6.  The `audio` element on `TtsGeneratorPage` renders and plays the audio.

### 2.5 AI Code Planner Flow

1.  User provides `userPrompt`, sets `projectRoot`, `scanPaths`, `additionalInstructions`, and `expectedOutputFormat` on `PlannerPage`.
2.  On "Generate Plan" click, `plannerStore.generatePlan` (via `PlanGenerator` component) calls `plannerService.generatePlan`.
3.  `plannerService.generatePlan` sends an `ILlmInput` object to `POST /api/plan`.
    *   The `projectRoot` and `scanPaths` are sent to the backend. The backend uses these to read relevant file contents for AI context.
4.  The backend uses the LLM to generate a `plan` (matching `IPlan` interface) based on the input and scanned context.
5.  The frontend receives the generated `IPlan` and updates `plannerStore`.
6.  `PlanDisplay` component renders the `plan` details, including proposed file changes and Git instructions.
7.  If the user clicks "Apply Plan", `plannerService.applyPlan` is called with the `plan.id` and `projectRoot` (if provided). This sends a request to `POST /api/plan/apply`.
8.  The backend executes the file changes described in the plan on the local filesystem at the specified `projectRoot`.
9.  The frontend receives the result of the application and updates the `applyStatus` in `plannerStore`.

## 3. Backend Interaction Points

The frontend primarily interacts with the `project-board-server` backend via RESTful API endpoints.

*   **Authentication**: `/api/auth/*`
*   **Google Gemini TTS**: `/api/google-tts/*`
*   **AI Code Planner**: `/api/plan/*`

The backend is responsible for:
*   Authentication logic and OAuth redirects.
*   Interfacing with Google Gemini's TTS API.
*   Interfacing with the AI/LLM for code planning.
*   Reading and writing files to the local filesystem (for the AI Planner), based on the `projectRoot` provided by the frontend.
*   Database operations (for storing user profiles, plans, etc.).

## 4. Considerations and Future Enhancements

*   **Error Handling**: Robust error messages and user feedback are implemented, but further global error handling strategies (e.g., interceptors) could be considered.
*   **Loading States**: Granular loading states for specific UI elements can enhance user experience.
*   **Performance**: Optimize component rendering, especially in data-heavy sections like `PlanDisplay` or future file tree browsers.
*   **Testing**: Implement unit, integration, and end-to-end tests for critical functionalities.
*   **Scalability**: The modular structure supports adding more AI tools and features without significant refactoring.
*   **WebSockets**: For real-time feedback during AI plan generation or application (e.g., streaming file changes), WebSockets could be introduced.
*   **File Tree Browsing**: The `DirectoryPickerDrawer` currently relies on manual path input. Future enhancements could include dynamic browsing of the local filesystem (requires a robust backend service for file system access).
*   **AI Plan Previews/Diffs**: Showing a direct diff preview for `MODIFY` changes within the UI before applying.
