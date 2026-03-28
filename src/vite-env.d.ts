/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FRONTEND_URL: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_API_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
