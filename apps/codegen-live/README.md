# Gemini Live Interaction Frontend

This is a React application built with Vite and Tailwind CSS to demonstrate real-time voice and video interactions with Google Gemini Live via a NestJS WebSocket backend.

## Setup

1.  **Install Dependencies:**

    ```bash
    cd apps/codegen-live
    npm install
    # or yarn install
    # or pnpm install
    ```

2.  **Start the Development Server:**

    ```bash
    npm run dev
    # or yarn dev
    # or pnpm dev
    ```

    The application will typically run on `http://localhost:3001` (or another port as configured in `vite.config.ts`).

## Usage

1.  Ensure your NestJS backend for Gemini Live is running and accessible (e.g., at `http://localhost:3000`).
2.  Open the frontend application in your browser.
3.  Click the "Start Recording" button. Your browser will likely ask for microphone permission. Grant it.
4.  Speak into your microphone. Your speech will be sent to the backend, processed by Gemini Live, and the AI's text and audio responses will be displayed in real-time.
5.  You can type an initial prompt in the input field before starting the recording to guide the AI's first response.
6.  Click "Stop Recording" to end the session.

## Technology Stack

- **React**: Frontend UI library.
- **Vite**: Fast frontend tooling.
- **Tailwind CSS (v4)**: Utility-first CSS framework for styling.
- **Nano Stores**: Minimalistic state management library.
- **Socket.IO Client**: For WebSocket communication with the NestJS backend.
- **Web Audio API / MediaRecorder API**: For capturing microphone input.
