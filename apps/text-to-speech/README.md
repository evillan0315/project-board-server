# Google Gemini TTS Generator Frontend

## Project Overview

This is a modern React/Vite frontend application designed to interact with a Node.js/NestJS backend for Google Gemini Text-to-Speech (TTS) generation. It empowers users to input text, configure multiple speakers with specific voice profiles, generate high-quality speech audio, and play it directly within the browser. The application emphasizes a clean, intuitive user experience with robust authentication and error handling.

For a deep dive into the application's architecture and design principles, please refer to the [Overview and Architecture document](docs/OVERVIEW_ARCHITECTURE.md).

## Features

-   **Authentication:** Seamless integration with JWT-based authentication, supporting Google OAuth2 and GitHub OAuth2 via the backend server.
-   **Dynamic Text Input:** Flexible text area for inputting content to be synthesized.
-   **Multi-Speaker Configuration:** Users can dynamically add, remove, and configure speaker profiles, assigning a unique speaker name (for AI prompting) and a specific voice name (e.g., 'Kore', 'Puck').
-   **Language Selection:** Ability to specify the language code for speech output (defaults to 'en-US').
-   **Integrated Audio Playback:** Generated `.wav` audio files are played directly in the browser for immediate feedback.
-   **User Feedback:** Provides clear visual cues for loading states, along with comprehensive error handling and messaging.
-   **Theming:** Light/Dark mode toggle for personalized viewing.

## Technologies Used

-   **Frontend**: React, Vite, TypeScript, Material UI v6, Tailwind CSS v4, Nanostores, Axios, React Router DOM.
-   **Backend (Interacts with)**: Node.js, NestJS, Google Gemini API.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [pnpm](https://pnpm.io/) (recommended package manager)
-   The corresponding backend server (`project-board-server`) running and accessible (typically at `http://localhost:3000`) with authentication and Google Gemini TTS configured.

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/evillan0315/project-board-server.git
    cd project-board-server
    ```

2.  **Navigate to the frontend application directory:**
    ```bash
    cd apps/text-to-speech
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

Create a `.env` file in the `apps/text-to-speech` directory for local development:

```env
VITE_APP_API_BASE_URL=http://localhost:3000
VITE_FRONTEND_PORT=3002
```

-   `VITE_APP_API_BASE_URL`: The base URL of your backend API. Ensure this matches the URL where your `project-board-server` is running.
-   `VITE_FRONTEND_PORT`: The port your frontend application runs on during development (e.g., `3002`). This is used for OAuth callback URLs.

#### Backend OAuth Configuration

For Google and GitHub OAuth to work, ensure your backend's (`project-board-server/.env`) OAuth callback URLs are correctly configured to point to this frontend application:

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

# ...
FRONTEND_URL='http://localhost:3002' # Ensure this is correctly set in backend too
```

> **Note**: The default development port for this frontend is `3002`, which is reflected in the callback URLs above. The Vite preview server typically runs on `4173`.

### Running the Application

To start the development server:

```bash
pnpm run dev
```

This will start the development server, usually accessible at `http://localhost:3002`. You can then navigate to `/login` to authenticate.

### Building for Production

To compile the application for production:

```bash
pnpm run build
```

This command compiles the application for production, and the output will be in the `dist/` directory.

## Detailed Guides

For more in-depth information, refer to the following documentation files:

*   [**User Guide**](docs/USER_GUIDE.md): How to use the application's features.
*   [**Developer Guide**](docs/DEVELOPER_GUIDE.md): Detailed setup, coding standards, and project architecture for contributors.
*   [**Overview and Architecture**](docs/OVERVIEW_ARCHITECTURE.md): A comprehensive explanation of the system's design and architecture.
*   [**Deployment Guide**](docs/DEPLOYMENT.md): Instructions for deploying the application to various environments.

## Project Structure

```
text-to-speech/
├── public/                     # Static assets
├── src/                        # Main application source code
│   ├── api/                    # API client services (Axios)
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Page-level components (routes)
│   ├── stores/                 # Nanostores for global state management
│   ├── theme/                  # Material UI theme configuration
│   ├── types/                  # TypeScript type definitions
│   └── App.tsx                 # Main application component
├── docs/                       # Project documentation (User, Developer, Overview, Deployment guides)
├── kubernetes/                 # Kubernetes deployment configurations
├── .env                        # Environment variables
├── .editorconfig               # Editor configuration
├── .eslintrc.ts                # ESLint configuration
├── .gitignore                  # Files ignored by Git
├── .dockerignore               # Files ignored by Docker
├── Dockerfile                  # Docker build instructions
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── README.md                   # Project README (this file)
```

## Backend Endpoints

This frontend interacts with the following backend endpoints (assuming `VITE_APP_API_BASE_URL` is configured):

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
            { "speaker": "Eddie", "voiceName": "kore" },
            { "speaker": "Marionette", "voiceName": "puck" }
          ],
          "languageCode": "en-US" // Optional
        }
        ```
    -   **Response:** A `.wav` audio file (binary stream).

## Customization

-   **Theme:** The Material UI theme can be customized in `src/theme/index.ts`.
-   **Tailwind CSS:** Modify `tailwind.config.js` for custom classes and design system adaptations.
-   **Voice Names:** The `voiceName` values in the speaker configurations depend on the available voices in your Google Gemini TTS setup. Refer to Google's documentation or your backend implementation for valid voice names.

## Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

*   Thanks to Google Gemini for the powerful Text-to-Speech capabilities.
*   Inspired by modern web development practices and tools.
*   

## 📧 Contact

Eddie Villanueva - [evillan0315@gmail.com](mailto:evillan0315@gmail.com)
[LinkedIn](https://www.linkedin.com/in/eddie-villalon/)
[GitHub](https://github.com/evillan0315)
