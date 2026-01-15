import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const isValidConfig =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId;

if (!isValidConfig) {
    console.warn('⚠️ Firebase credentials not configured. Please set VITE_FIREBASE_* variables in your .env file.');
    console.warn('Required variables:');
    console.warn('  - VITE_FIREBASE_API_KEY');
    console.warn('  - VITE_FIREBASE_AUTH_DOMAIN');
    console.warn('  - VITE_FIREBASE_PROJECT_ID');
    console.warn('  - VITE_FIREBASE_STORAGE_BUCKET');
    console.warn('  - VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.warn('  - VITE_FIREBASE_APP_ID');
}

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth only (database is now handled by Supabase)
export const auth = getAuth(app);

// Export validation status for components to check
export const isFirebaseConfigured = isValidConfig;

export default app;

