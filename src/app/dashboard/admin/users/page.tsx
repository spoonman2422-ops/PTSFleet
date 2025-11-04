
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User, UserRole, Vehicle } from "@/lib/types";
import { UserDialog } from "@/components/admin/user-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from "@/firebase";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { logActivity } from "@/lib/activity-log-service";


const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
    Admin: "destructive",
    Dispatcher: "secondary",
    Driver: "outline",
};

export default function UserManagementPage() {
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  const { data: vehicles, isLoading: isLoadingVehicles } = useCollection<Vehicle>('vehicles');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setIsAlertOpen(true);
  };

  const handleSaveUser = async (userData: Omit<User, 'id' | 'avatarUrl'> & { password?: string }, userId?: string) => {
    if (!firestore || !auth || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available or not authenticated.' });
        return;
    }

    try {
      if (userId) { // Editing existing user
        const userRef = doc(firestore, "users", userId);
        const { name, email, role, vehicleId } = userData;
        const dataToUpdate: Partial<User> = { name, email, role, vehicleId };
        if (role !== 'Driver') {
            dataToUpdate.vehicleId = null;
        }

        await updateDoc(userRef, dataToUpdate);
        await logActivity({
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: userId,
          details: `Updated profile for ${name}`,
        });
        toast({ title: 'User Updated', description: `${name} has been updated.` });

      } else { // Creating new user
        if (!userData.password) {
          toast({ variant: 'destructive', title: 'Error', description: 'Password is required to create a user.' });
          return;
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const authUser = userCredential.user;

        // Save user profile to Firestore
        const newUser: Omit<User, 'id'> = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatarUrl: `https://picsum.photos/seed/${authUser.uid}/100/100`,
          vehicleId: userData.vehicleId || null,
        };
        if (newUser.role !== 'Driver') {
            newUser.vehicleId = null;
        }

        await setDoc(doc(firestore, "users", authUser.uid), newUser);
        await logActivity({
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: authUser.uid,
          details: `Created new user: ${userData.name}`,
        });

        toast({ title: 'User Created', description: `${userData.name} has been added.` });
      }
      setIsDialogOpen(false);
      setEditingUser(null);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Failed to ${userId ? 'update' : 'create'} user`,
        description: error.message || 'An unknown error occurred.',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser || !firestore || !currentUser) return;

    try {
      const userRef = doc(firestore, 'users', deletingUser.id);
      await deleteDoc(userRef);

      await logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: deletingUser.id,
        details: `Deleted user: ${deletingUser.name}`,
      });

      toast({
        title: 'User Profile Deleted',
        description: `${deletingUser.name}'s profile has been removed from the database.`,
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Failed to delete user profile',
        description: error.message || 'Please note: Deleting the authentication record requires server-side logic (Firebase Functions) which is not implemented.',
      });
    } finally {
        setIsAlertOpen(false);
        setDeletingUser(null);
    }
  };
  
  const isLoading = isLoadingUsers || isLoadingVehicles;


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage users and their roles.
            </p>
          </div>
          <Button onClick={handleAddUser}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Vehicle Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (users || []).map((user) => {
                  const assignedVehicle = vehicles?.find(v => v.id === user.vehicleId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={user.avatarUrl}
                              alt={user.name}
                            />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{user.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        {user.role === 'Driver' ? (
                          assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model} (${assignedVehicle.plateNumber})` : 'Unassigned'
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(user)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <UserDialog 
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveUser}
          user={editingUser}
          vehicles={vehicles || []}
        />
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user profile for{' '}
              <span className="font-bold">{deletingUser?.name}</span> from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
