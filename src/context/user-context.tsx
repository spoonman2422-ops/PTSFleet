
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
        setIsLoading(false);
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
      // If the user doesn't exist (or other invalid credential errors), try creating them.
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createError) {
          // If creation fails (e.g. weak password, email already exists from a previous failed attempt), throw that error.
          throw createError;
        }
      } else {
        // For other errors (e.g. network error), throw them.
        throw error;
      }
    }
    // The onAuthStateChanged listener will handle setting the user and routing
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    // The onAuthStateChanged listener will handle setting user to null and routing
  };
  
  const value = { user, login, logout, isLoading };

  // Show a global loader while we are determining auth state,
  // especially when navigating to a protected page.
  if (isLoading && pathname.startsWith('/dashboard')) {
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
