"use client";

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { users } from '@/lib/data';
import type { UserRole } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, LogIn } from 'lucide-react';

const roles: UserRole[] = ['Admin', 'Dispatcher', 'Driver'];

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { login, isLoading } = useUser();

  const usersInRole = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(user => user.role === selectedRole);
  }, [selectedRole]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as UserRole);
    setSelectedUser('');
    setError('');
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setError('');
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to continue.');
      return;
    }
    setError('');
    login(selectedUser);
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
          <Select onValueChange={handleUserChange} value={selectedUser} disabled={usersInRole.length === 0}>
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
      
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={!selectedUser || isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
        <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
