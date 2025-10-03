'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { app, auth, firestore } from './index';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    if (auth) {
      // Sign in anonymously to satisfy security rules for storage, etc.
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in.
          setIsFirebaseReady(true);
        } else {
          // No user is signed in, attempt to sign in anonymously.
          signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            // Still set to ready, but things might fail.
            setIsFirebaseReady(true); 
          });
        }
      });
      return () => unsubscribe();
    } else if (!app && !auth && !firestore) {
      // This handles the case where config is missing
      setIsFirebaseReady(true);
    }
  }, []);

  if (!app || !auth || !firestore) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
            <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
                <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
                <p className="mt-4 text-muted-foreground">
                    It looks like your Firebase project configuration is missing. Please add your Firebase config object to{' '}
                    <code className="rounded bg-muted px-1 font-mono text-sm">src/firebase/config.ts</code>.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    You can find this in your Firebase project settings.
                </p>
            </div>
        </div>
    );
  }

  if (!isFirebaseReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }
  
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  if (!context.app || !context.auth || !context.firestore) {
    throw new Error('Firebase has not been initialized correctly. Check your configuration.');
  }
  return context as { app: FirebaseApp, auth: Auth, firestore: Firestore };
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
