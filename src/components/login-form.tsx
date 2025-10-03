
"use client";

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { users } from '@/lib/data';
import type { User, UserRole } from '@/lib/types';

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
  const [error, setError] = useState<string>('');
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
    setError('');
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setError('');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to continue.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    setError('');

    const userToLogin = users.find(u => u.id === selectedUserId);
    if (!userToLogin) {
        setError('Selected user not found.');
        return;
    }

    try {
      await login(userToLogin.email, password);
    } catch (err: any) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: err.message || "An unexpected error occurred."
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
      
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={!selectedUserId || !password || isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
        <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
