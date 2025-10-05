
"use client";

import { useState } from "react";
import { ExpenseDialog } from "@/components/admin/expense-dialog";
import { ExpenseTable } from "@/components/admin/expense-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import type { Expense, User } from "@/lib/types";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>("expenses");
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>("users");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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

  const handleSaveExpense = async (data: Omit<Expense, 'id' | 'addedBy' | 'inputVat' | 'vatRate'>, id?: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to perform this action.",
      });
      return;
    }

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
              <CardDescription>View, filter, and manage all logged expenses.</CardDescription>
          </CardHeader>
          <CardContent>
              <ExpenseTable 
                  data={expenses || []} 
                  users={users || []} 
                  isLoading={isLoading} 
                  onEdit={handleEdit}
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
    </>
  );
}
