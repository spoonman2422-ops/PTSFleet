
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  type AuthError
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
        // Firebase auth is not ready yet.
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile = users.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (userProfile) {
            setUser(userProfile);
        } else {
            // This case can happen if a user exists in Firebase Auth but not in our static data
            signOut(auth);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // This effect handles routing based on auth state
    if (!isLoading) {
      const isAuthPage = pathname === '/';
      if (user && isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createError) {
          const createAuthError = createError as AuthError;
          if (createAuthError.code === 'auth/email-already-in-use') {
            // This means the user exists, but the initial sign-in failed, implying a wrong password.
            // We throw the original error to be caught by the form.
            throw authError;
          }
          // For other creation errors (e.g., weak password), throw that error.
          throw createError;
        }
      } else {
        // For other login errors (e.g. network error), throw them.
        throw error;
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    // The onAuthStateChanged listener will handle setting user to null and routing
  };
  
  const value = { user, login, logout, isLoading };

  // Show a global loader while we are determining auth state,
  // especially when navigating to a protected page.
   if (isLoading && pathname !== '/') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }


  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
