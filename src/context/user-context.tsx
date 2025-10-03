
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
  createUser: (email: string, password: string) => Promise<void>;
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
        // Find user in our static data. In a real app, this would be a fetch from Firestore.
        const userProfile = users.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (userProfile) {
            setUser(userProfile);
        } else {
            // This case can happen if a user exists in Firebase Auth but not in our static data,
            // for example if they were deleted from the user management page.
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
    // The login function will now just try to sign in.
    // If it fails, it will throw the error to be handled by the component.
    await signInWithEmailAndPassword(auth, email, password);
  };

  const createUser = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    await createUserWithEmailAndPassword(auth, email, password);
  };


  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    // The onAuthStateChanged listener will handle setting user to null and routing
  };
  
  const value = { user, login, logout, isLoading, createUser };

   if (isLoading && !pathname.startsWith('/')) {
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
