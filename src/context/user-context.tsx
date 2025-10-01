"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';

interface UserContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = () => {
      try {
        const storedUserId = localStorage.getItem('pts-user-id');
        if (storedUserId) {
          const foundUser = users.find(u => u.id === storedUserId);
          if (foundUser) {
            setUser(foundUser);
          } else {
            localStorage.removeItem('pts-user-id');
          }
        }
      } catch (error) {
        console.error("Could not access localStorage", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only run this on the client
    if (typeof window !== 'undefined') {
        checkUser();
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (user && pathname === '/') {
        router.push('/dashboard');
      } else if (!user && pathname.startsWith('/dashboard')) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  const login = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      try {
        localStorage.setItem('pts-user-id', userId);
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
     try {
        localStorage.removeItem('pts-user-id');
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
    router.push('/');
  };
  
  const value = { user, login, logout, isLoading };

  if (isLoading) {
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
