/// <reference types="vite/client" />

interface ImportMetaEnv {
  // readonly VITE_WS_URL: string; // Removed, VITE_API_URL covers WebSocket proxy
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_URL: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CALLBACK_URL: string;
  readonly GITHUB_CLIENT_ID: string;
  readonly GITHUB_CALLBACK_URL: string;
  // more env variables... add them here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
