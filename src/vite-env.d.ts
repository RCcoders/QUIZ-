/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase has been removed — no VITE_FIREBASE_* vars required
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
