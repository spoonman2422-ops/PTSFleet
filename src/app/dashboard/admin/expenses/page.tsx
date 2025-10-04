
"use client";

import { ExpenseForm } from "@/components/admin/expense-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpensesPage() {
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
    </div>
  );
}
