
"use client";

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { users } from '@/lib/data';
import type { User, UserRole } from '@/lib/types';
import { type AuthError } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roles: UserRole[] = ['Admin', 'Dispatcher', 'Driver', 'Accountant'];

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useUser();
  const { toast } = useToast();

  const usersInRole = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(user => user.role === selectedRole);
  }, [selectedRole]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as UserRole);
    setSelectedUserId('');
    setPassword('');
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = users.find(u => u.id === selectedUserId);
    if (!userToLogin) {
      // This case should ideally not be hit if UI is working correctly
      toast({ variant: "destructive", title: "Login Error", description: "Please select a valid user." });
      return;
    }

    try {
      await login(userToLogin.email, password);
    } catch (err) {
      console.error(err);
      const authError = err as AuthError;
      let message = "An unexpected error occurred during login.";
      
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please try again.';
      } else if (authError.code === 'auth/weak-password') {
        message = 'The password is too weak. Please use at least 6 characters.';
      } else if (authError.code === 'auth/email-already-in-use') {
         message = 'This email is already in use with a different password.';
      }
      
      toast({
          variant: "destructive",
          title: "Login Failed",
          description: message,
      })
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="role-select">Select Your Role</Label>
        <Select onValueChange={handleRoleChange} value={selectedRole}>
          <SelectTrigger id="role-select" className="w-full">
            <SelectValue placeholder="Choose a role..." />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole && (
        <div className="space-y-2">
          <Label htmlFor="user-select">Select User</Label>
          <Select onValueChange={handleUserChange} value={selectedUserId} disabled={usersInRole.length === 0}>
            <SelectTrigger id="user-select" className="w-full">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {usersInRole.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedUserId && (
          <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                />
          </div>
      )}
      
      <Button type="submit" className="w-full" disabled={!selectedUserId || !password || isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
        <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
