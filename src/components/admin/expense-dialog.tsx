
"use client";

import { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Expense } from '@/lib/types';
import { ExpenseForm } from './expense-form';

// Define the shape of the data the form expects
type ExpenseFormValues = Omit<Expense, 'id' | 'addedBy' | 'inputVat' | 'vatRate' | 'dateIncurred'> & {
    dateIncurred: Date;
};

type ExpenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Expense, 'id' | 'addedBy'| 'inputVat' | 'vatRate'>, id?: string) => Promise<void>;
  expense: Expense | null;
};

export function ExpenseDialog({ isOpen, onOpenChange, onSave, expense }: ExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!expense;

  const defaultValues = {
      category: undefined,
      description: "",
      amount: 0,
      vatIncluded: false,
      dateIncurred: new Date(),
      paidBy: undefined,
      notes: "",
  };

  const [formValues, setFormValues] = useState<Partial<ExpenseFormValues>>(defaultValues);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && expense) {
        setFormValues({
          ...expense,
          dateIncurred: expense.dateIncurred ? parseISO(expense.dateIncurred) : new Date(),
        });
      } else {
        setFormValues(defaultValues);
      }
    }
  }, [isOpen, isEditMode, expense]);


  const handleSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    // The date from the form is already a Date object, but onSave expects string or date.
    // The parent `expenses/page.tsx` will handle formatting it to a string.
    await onSave(data, expense?.id);
    setIsSubmitting(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormValues(defaultValues);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Expense' : 'Log New Expense'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of the expense below." : 'Fill in the details below to record a new expense.'}
          </DialogDescription>
        </DialogHeader>

        {/* We pass a key to force re-mounting of the form when the dialog opens */}
        <ExpenseForm 
            key={isOpen ? (expense?.id || 'new') : 'closed'}
            onSubmit={handleSubmit} 
            defaultValues={formValues} 
            isSubmitting={isSubmitting} 
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
