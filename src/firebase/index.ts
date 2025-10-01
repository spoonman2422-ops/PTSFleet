'use client';
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

  return { app, auth, firestore };
}

export const { app, auth, firestore } = initializeFirebase();

export { 
  useCollection,
  useDoc 
} from './firestore/hooks';
export { useUser } from './auth/hooks';
export * from './provider';
