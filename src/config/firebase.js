import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZcq5lOksvPAoG5NM1Almxt97kc4W_BIQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artiva-f24a8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artiva-f24a8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artiva-f24a8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "982788741499",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:982788741499:web:eb198aafb9f6f43adb45de",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YX17QZB29E"
};

// Ensure app is initialized only once (Singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication using the singleton App instance
export const auth = getAuth(app);

// Initialize default Firestore instance
export const db = getFirestore(app);

// Initialize Analytics safely only if supported and measurementId exists
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Initialize Performance Monitoring safely only in browser environments
export let perf = null;
if (typeof window !== 'undefined') {
  try {
    perf = getPerformance(app);
  } catch (perfErr) {
    // Non-fatal if browser doesn't support PerformanceObserver or blocked by extensions
    console.debug('Firebase Performance Monitoring unavailable:', perfErr);
  }
}

// Connect to Emulators if configured
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  if (typeof window !== 'undefined') {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
  }
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch (emulatorErr) {
    console.warn('Firebase emulator connection warning:', emulatorErr);
  }
}
