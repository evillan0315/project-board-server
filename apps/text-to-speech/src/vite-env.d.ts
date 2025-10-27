/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_BASE_URL: string;
  // Removed VITE_APP_JWT_TOKEN as it's no longer used for mocking
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
