
"use client";

import { useState } from "react";
import { users as initialUsers } from "@/lib/data";
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
import type { User, UserRole } from "@/lib/types";
import { UserDialog } from "@/components/admin/user-dialog";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
    Admin: "destructive",
    Dispatcher: "secondary",
    Driver: "outline",
    Accountant: "default"
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { createUser } = useUser();
  const { toast } = useToast();

  const handleAddUser = () => {
    setIsDialogOpen(true);
  };

  const handleSaveUser = async (userData: Omit<User, 'id' | 'avatarUrl'> & { password?: string }) => {
    if (!userData.password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password is required to create a user.' });
      return;
    }
    
    try {
      // Create user in Firebase Auth
      await createUser(userData.email, userData.password);

      // In a real app, we'd save the user to Firestore and get a new ID from there.
      // For now, we'll just add them to the local state with a temporary ID.
      // Crucially, we also add them to the "master" list in memory so they can be "found" after login.
      const newUser: User = {
        ...userData,
        id: `user-temp-${Date.now()}`, // The ID needs to be unique but doesn't have to match Firebase Auth UID for this demo
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
      };
      
      // Add to the "master" in-memory list
      initialUsers.push(newUser);
      
      // Update the component's state to re-render the table
      setUsers(prevUsers => [...prevUsers, newUser]);

      toast({ title: 'User Created', description: `${userData.name} has been added.` });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: error.message || 'An unknown error occurred.',
      });
    }
  };


  return (
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <UserDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveUser}
      />
    </div>
  );
}
