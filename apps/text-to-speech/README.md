# Google Gemini TTS Generator Frontend

This is a React/Vite frontend application designed to interact with the Google Gemini Text-to-Speech (TTS) backend controller (`/api/google-tts/generate`). It allows users to input text, configure multiple speakers, generate speech audio, and play it directly in the browser.

## Features

-   **Authentication:** Integrates with JWT-based authentication, Google OAuth2, and GitHub OAuth2 provided by the backend server.
-   **Text Input:** Type or paste text for speech synthesis.
-   **Multi-Speaker Configuration:** Dynamically add and remove speaker profiles, specifying a speaker name (for the AI prompt) and a voice name (e.g., 'Kore', 'Puck').
-   **Language Selection:** Set the language code for the speech output (defaults to 'en-US').
-   **Audio Playback:** Plays the generated `.wav` audio file directly in the browser.
-   **Loading & Error Handling:** Provides visual feedback during API calls and displays error messages.

## Technologies Used

-   **React** & **Vite**: Fast development and build tool for modern web projects.
-   **TypeScript**: Type-safe JavaScript.
-   **Material UI**: A comprehensive React UI component library for consistent and accessible design.
-   **Tailwind CSS**: A utility-first CSS framework for rapid custom styling.
-   **Nanostores**: A tiny, fast, and testable state manager for React.
-   **Axios**: Promise-based HTTP client for the browser and Node.js.
-   **React Router DOM**: Declarative routing for React.

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   pnpm (recommended package manager)
-   The backend server (`project-board-server`) running on `http://localhost:3000` with authentication configured.

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/evillan0315/project-board-server.git
    cd project-board-server
    ```

2.  **Navigate to the frontend application directory:**
    ```bash
    cd apps/project-demo
    ```

3.  **Install dependencies:**
    ```bash
    pnpm install
    ```

4.  **Initialize Tailwind CSS (if not already done by script):**
    ```bash
    pnpm run tailwind:init
    ```

### Configuration

Create a `.env` file in the `apps/project-demo` directory for local development:

```env
VITE_APP_API_BASE_URL=http://localhost:3000
```

-   `VITE_APP_API_BASE_URL`: The base URL of your backend API. Ensure this matches the URL where your `project-board-server` is running.

#### Backend OAuth Configuration

For Google and GitHub OAuth to work, ensure your backend's (`project-board-server/.env`) OAuth callback URLs are correctly configured to point to this frontend application:

```env
# ... other backend configs

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID='your_google_client_id'
GOOGLE_CLIENT_SECRET='your_google_client_secret'
GOOGLE_CALLBACK_URL='http://localhost:3001/auth/callback' # Must match this frontend's callback route

# GitHub OAuth2 Credentials
GITHUB_CLIENT_ID='your_github_client_id'
GITHUB_CLIENT_SECRET='your_github_client_secret'
GITHUB_CALLBACK_URL='http://localhost:3001/auth/callback' # Must match this frontend's callback route

# ...
FRONTEND_URL='http://localhost:3001' # Ensure this is correctly set in backend too
```

### Running the Application

```bash
pnpm run dev
```

This will start the development server, usually accessible at `http://localhost:5173`. You can then navigate to `/login` to authenticate.

### Building for Production

```bash
pnpm run build
```

This command compiles the application for production, and the output will be in the `dist/` directory.

## Backend Endpoints

This frontend interacts with the following backend endpoints:

-   `POST /api/auth/login`: Authenticates with email and password.
-   `POST /api/auth/logout`: Invalidates the server-side session/cookie.
-   `GET /api/auth/google`: Initiates Google OAuth2 login redirect.
-   `GET /api/auth/github`: Initiates GitHub OAuth2 login redirect.
-   `GET /api/auth/me`: Fetches the profile of the currently authenticated user.
-   `POST /api/google-tts/generate`: Generates speech audio from text (requires authentication).
    -   **Description:** Generates speech audio from text using Google Gemini's TTS model, supporting multiple speakers.
    -   **Request Body (JSON):**
        ```json
        {
          "prompt": "Eddie: AI is changing everything!\nMarionette: And it's influencing fashion too.",
          "speakers": [
            { "speaker": "Eddie", "voiceName": "en-US-Studio-F" },
            { "speaker": "Marionette", "voiceName": "en-US-Studio-B" }
          ],
          "languageCode": "en-US" // Optional
        }
        ```
    -   **Response:** A `.wav` audio file (binary stream).

## Customization

-   **Theme:** The Material UI theme can be customized in `src/theme/index.ts`.
-   **Tailwind CSS:** Modify `tailwind.config.js` for custom classes and design system adaptations.
-   **Voice Names:** The `voiceName` values in the speaker configurations depend on the available voices in your Google Gemini TTS setup. Refer to Google's documentation or your backend implementation for valid voice names.
