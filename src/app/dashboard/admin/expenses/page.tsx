
"use client";

import { ExpenseForm } from "@/components/admin/expense-form";
import { ExpenseTable } from "@/components/admin/expense-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import type { Expense, User } from "@/lib/types";

export default function ExpensesPage() {
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>("expenses");
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>("users");
  
  const isLoading = isLoadingExpenses || isLoadingUsers;

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Log New Expense</CardTitle>
          <CardDescription>
            Record a new business expense. This is for general expenses not tied to a specific booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm />
        </CardContent>
      </Card>
      
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
            />
        </CardContent>
      </Card>
    </div>
  );
}
