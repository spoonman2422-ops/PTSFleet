
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/context/user-context';
import { type AuthError } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { login, createUser, isLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      const authError = err as AuthError;

      // This logic attempts to sign up the user if they don't exist yet.
      // This is useful for this demo app to automatically provision users.
      if (authError.code === 'auth/user-not-found') {
        try {
          await createUser(data.email, data.password);
          // After creating, try to log in again
          await login(data.email, data.password);
        } catch (createErr) {
          const createAuthError = createErr as AuthError;
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: createAuthError.message || 'Could not create account.',
          });
        }
      } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: authError.code === 'auth/invalid-credential' ? 'Invalid email or password.' : authError.message,
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="e.g., admin@pts.com" 
                  {...field} 
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Enter your password" 
                  {...field} 
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
          <LogIn className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
