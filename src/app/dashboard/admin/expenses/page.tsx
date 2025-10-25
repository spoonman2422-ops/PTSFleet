
"use client";

import { useState } from "react";
import { ExpenseDialog } from "@/components/admin/expense-dialog";
import { ExpenseTable } from "@/components/admin/expense-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import type { Expense, OwnerName, User } from "@/lib/types";
import { PlusCircle } from "lucide-react";
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


export default function ExpensesPage() {
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>("expenses");
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>("users");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (expense: Expense) => {
    setDeletingExpense(expense);
    setIsAlertOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense || !firestore) return;

    try {
      await deleteDoc(doc(firestore, "expenses", deletingExpense.id));
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Expense",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsAlertOpen(false);
      setDeletingExpense(null);
    }
  };

  const handleSaveExpense = async (data: Omit<Expense, 'id' | 'addedBy' | 'inputVat' | 'vatRate'> & { paidBy: "cash" | "bank" | "credit" | "PTS", creditedTo?: OwnerName | null }, id?: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to perform this action.",
      });
      return;
    }
    
    // Divert to reimbursements if paid by credit
    if (data.paidBy === 'credit') {
        if (!data.creditedTo) {
             toast({ variant: "destructive", title: "Missing Information", description: "Please select the owner to be credited." });
             return;
        }
        
        const reimbursementData = {
            category: data.category,
            description: data.description,
            amount: data.amount,
            dateIncurred: format(new Date(data.dateIncurred), "yyyy-MM-dd"),
            creditedTo: data.creditedTo,
            status: 'Pending' as const,
            addedBy: user.id,
            notes: data.notes
        };

        await addDoc(collection(firestore, "reimbursements"), reimbursementData);
        toast({ title: "Reimbursement Request Saved", description: "The request has been sent for liquidation." });

    } else {
        const vatRate = 0.12;
        const inputVat = data.vatIncluded ? data.amount * vatRate : 0;
        
        const dataToSave = {
          ...data,
          dateIncurred: format(new Date(data.dateIncurred), "yyyy-MM-dd"), // Ensure date is string
          vatRate,
          inputVat,
        };

        if (id) {
          // Update existing expense
          const expenseRef = doc(firestore, 'expenses', id);
          await updateDoc(expenseRef, dataToSave);
          toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
        } else {
          // Create new expense
          await addDoc(collection(firestore, "expenses"), {
            ...dataToSave,
            addedBy: user.id,
          });
          toast({ title: "Expense Saved", description: "The new expense has been logged successfully." });
        }
    }
    
    setIsDialogOpen(false);
  };
  
  const isLoading = isLoadingExpenses || isLoadingUsers;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
              <p className="text-muted-foreground">Log, view, and manage all business expenses.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>
        
        <Card>
          <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>View, filter, and manage all logged expenses. Credit-based expenses will appear here once liquidated.</CardDescription>
          </CardHeader>
          <CardContent>
              <ExpenseTable 
                  data={expenses || []} 
                  users={users || []} 
                  isLoading={isLoading} 
                  onEdit={handleEdit}
                  onDelete={handleOpenDeleteDialog}
              />
          </CardContent>
        </Card>
      </div>
      
      <ExpenseDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the expense: <span className="font-bold">{deletingExpense?.description}</span>.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive hover:bg-destructive/90">
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
