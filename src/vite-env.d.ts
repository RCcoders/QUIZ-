/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase (client-safe — all public)
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // NOTE: VITE_GEMINI_API_KEY has been removed.
  // Gemini calls now go through /api/generate-questions (server-side).
  // The server key is set in Vercel dashboard as GEMINI_API_KEY (no VITE_ prefix).
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
