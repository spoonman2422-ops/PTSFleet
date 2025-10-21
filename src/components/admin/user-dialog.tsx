
"use client";

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User, UserRole, Vehicle } from '@/lib/types';

const userSchemaBase = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Admin', 'Dispatcher', 'Driver']),
  vehicleId: z.string().nullable(),
});

const userSchemaCreate = userSchemaBase.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const userSchemaEdit = userSchemaBase.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});


type UserFormValues = z.infer<typeof userSchemaCreate>;

type UserDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<UserFormValues>, id?: string) => void;
  user: User | null;
  vehicles: Vehicle[];
};

const roles: Omit<UserRole, 'Accountant'>[] = ['Admin', 'Dispatcher', 'Driver'];
const UNASSIGNED_VALUE = "unassigned";

export function UserDialog({
  isOpen,
  onOpenChange,
  onSave,
  user,
  vehicles,
}: UserDialogProps) {
  const isEditMode = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? userSchemaEdit : userSchemaCreate),
    defaultValues: {
      name: '',
      email: '',
      role: 'Driver',
      password: '',
      vehicleId: null,
    },
  });

  const watchedRole = useWatch({ control: form.control, name: 'role' });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        form.reset({
          name: user.name,
          email: user.email,
          role: user.role,
          password: '',
          vehicleId: user.vehicleId || null,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          role: 'Driver',
          password: '',
          vehicleId: null,
        });
      }
    }
  }, [isOpen, isEditMode, user, form]);

  const onSubmit = (data: UserFormValues) => {
    const dataToSave = {
        ...data,
        vehicleId: data.vehicleId === UNASSIGNED_VALUE ? null : data.vehicleId,
    };
    onSave(dataToSave, user?.id);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the user's details below." : 'Fill in the details below to create a new user account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., john.d@example.com" {...field} readOnly={isEditMode} />
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
                  <FormLabel>{isEditMode ? 'New Password (Optional)' : 'Password'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditMode ? 'Leave blank to keep current password' : 'Min. 6 characters'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            {watchedRole === 'Driver' && (
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Assigned</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === UNASSIGNED_VALUE ? null : value)}
                      value={field.value ?? UNASSIGNED_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {`${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
