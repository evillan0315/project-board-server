/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_URL: string;
  readonly GITHUB_CALLBACK_URL: string;
  readonly GOOGLE_CALLBACK_URL: string;
  readonly VITE_BASE_DIR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
