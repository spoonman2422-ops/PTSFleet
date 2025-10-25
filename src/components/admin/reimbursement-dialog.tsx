
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
import type { Reimbursement, OwnerName } from '@/lib/types';
import { ReimbursementForm } from './reimbursement-form';

type ReimbursementFormValues = Omit<Reimbursement, 'id' | 'addedBy' | 'status' | 'dateIncurred' | 'liquidatedAt' | 'liquidatedBy'> & {
    dateIncurred: Date;
};

type ReimbursementDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Reimbursement, 'id' | 'addedBy' | 'status' | 'liquidatedAt' | 'liquidatedBy'>, id: string) => Promise<void>;
  reimbursement: Reimbursement | null;
};

export function ReimbursementDialog({ isOpen, onOpenChange, onSave, reimbursement }: ReimbursementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: Partial<ReimbursementFormValues> = {
      category: undefined,
      description: "",
      amount: 0,
      dateIncurred: new Date(),
      creditedTo: undefined,
      notes: "",
  };

  const [formValues, setFormValues] = useState<Partial<ReimbursementFormValues>>(defaultValues);

  useEffect(() => {
    if (isOpen && reimbursement) {
        setFormValues({
          ...reimbursement,
          dateIncurred: reimbursement.dateIncurred ? parseISO(reimbursement.dateIncurred) : new Date(),
        });
    }
  }, [isOpen, reimbursement]);


  const handleSubmit = async (data: ReimbursementFormValues) => {
    if (!reimbursement) return;
    setIsSubmitting(true);
    await onSave(data, reimbursement.id);
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
          <DialogTitle>Edit Reimbursement Request</DialogTitle>
          <DialogDescription>
            Update the details of the reimbursement request below.
          </DialogDescription>
        </DialogHeader>

        <ReimbursementForm 
            key={isOpen ? (reimbursement?.id || 'new') : 'closed'}
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
