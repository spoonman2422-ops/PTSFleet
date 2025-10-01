'use client';
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// This is a placeholder for the Firebase config object
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !(auth as any).emulatorConfig) {
    // Point to the emulators running on localhost.
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  }

  return { app, auth, firestore };
}

export const { app, auth, firestore } = initializeFirebase();

export { 
  useCollection,
  useDoc 
} from './firestore/hooks';
export { useUser } from './auth/hooks';
export * from './provider';
