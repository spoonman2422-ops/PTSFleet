
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  type AuthError,
  type UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import type { User } from '@/lib/types';


interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  createUser: (email: string, password: string) => Promise<UserCredential>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (!auth || !firestore) {
        setIsLoading(false);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userProfile = { id: userDocSnap.id, ...userDocSnap.data() } as User;
            setUser(userProfile);
        } else {
            // User is authenticated but has no profile in Firestore.
            // Create a default profile for them.
            // This is a recovery mechanism. If the admin logs in and has no profile,
            // we create one for them with the 'Admin' role.
            const isAdmin = firebaseUser.email === 'admin@pts.com';
            
            console.warn(`No profile found for user ${firebaseUser.uid}. Creating a default profile.`);
            const newUserProfile: Omit<User, 'id'> = {
              name: firebaseUser.email?.split('@')[0] || 'New User',
              email: firebaseUser.email!,
              role: isAdmin ? 'Admin' : 'Driver', // Assign Admin role if it's the admin email
              avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            };
            await setDoc(userDocRef, newUserProfile);
            setUser({ id: firebaseUser.uid, ...newUserProfile });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const createUser = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    return createUserWithEmailAndPassword(auth, email, password);
  };


  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
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
