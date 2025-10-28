/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_URL: string;
  readonly GITHUB_CALLBACK_URL: string;
  readonly GOOGLE_CALLBACK_URL: string;
  readonly VITE_BASE_DIR: string;
  readonly VITE_PREVIEW_APP_URL?: string;
  readonly VITE_SLS_API_KEY: string;
  readonly VITE_SLS_API_URL: string;
  readonly VITE_SLS_USERNAME: string;
  readonly VITE_SLS_VIDU_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
