'use client';
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';

function initializeFirebase() {
  const apps = getApps();
  // Check if firebaseConfig is populated
  const isConfigProvided = Object.keys(firebaseConfig).length > 0;
  
  let app;
  if (isConfigProvided) {
    app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
  } else {
    // If no config, we can't initialize. We can return dummy/null objects
    // or throw an error. For now, we handle this gracefully in the components.
    // This case happens when the user has not yet provided their config.
    return { app: null, auth: null, firestore: null };
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !(auth as any).emulatorConfig) {
    // Point to the emulators running on localhost.
    // Note: If you are using a real project, you might want to remove this
    // or use a condition to only run this for local development.
    try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(firestore, 'localhost', 8080);
    } catch (e) {
        console.warn("Could not connect to Firebase emulators. This is expected if you are not running them.", e);
    }
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
