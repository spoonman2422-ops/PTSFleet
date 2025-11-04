
"use client";

import { useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Reimbursement, User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ReimbursementTable } from '@/components/admin/reimbursement-table';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ReimbursementDialog } from '@/components/admin/reimbursement-dialog';
import { format } from 'date-fns';
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
import Papa from 'papaparse';

export default function ReimbursementsPage() {
  const { data: reimbursements, isLoading: isLoadingReimbursements } = useCollection<Reimbursement>('reimbursements');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [editingReimbursement, setEditingReimbursement] = useState<Reimbursement | null>(null);
  const [deletingReimbursement, setDeletingReimbursement] = useState<Reimbursement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);


  const handleLiquidate = async (reimbursement: Reimbursement) => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "Authentication error." });
        return;
    }

    if (reimbursement.category === 'cash advance') {
        // Special handling for cash advance liquidation
        if (!reimbursement.driverId) {
            toast({ variant: "destructive", title: "Missing Driver", description: "Cannot liquidate cash advance without a driver."});
            return;
        }
        await addDoc(collection(firestore, 'cashAdvances'), {
            driverId: reimbursement.driverId,
            amount: reimbursement.amount,
            date: reimbursement.dateIncurred,
            paidBy: 'Credit',
            creditedTo: reimbursement.creditedTo,
            addedBy: user.id
        });
        
    } else {
        // Standard expense liquidation
        const expenseData: any = {
            category: reimbursement.category,
            description: reimbursement.description,
            amount: reimbursement.amount,
            vatIncluded: false,
            vatRate: 0,
            inputVat: 0,
            dateIncurred: reimbursement.dateIncurred,
            paidBy: "PTS" as const,
            creditedTo: reimbursement.creditedTo,
            addedBy: user.id,
            notes: `Liquidated from reimbursement request #${reimbursement.id.substring(0, 7)}. Original request by user ID: ${reimbursement.addedBy}`
        };

        if (reimbursement.bookingId) {
            expenseData.bookingId = reimbursement.bookingId;
        }

        await addDoc(collection(firestore, 'expenses'), expenseData);
    }

    // 2. Update the reimbursement status
    const reimbursementRef = doc(firestore, 'reimbursements', reimbursement.id);
    await updateDoc(reimbursementRef, {
        status: 'Liquidated',
        liquidatedBy: user.id,
        liquidatedAt: new Date().toISOString()
    });

    toast({
        title: "Reimbursement Liquidated",
        description: `The request has been processed and marked as complete.`
    });
  };

  const handleEdit = (reimbursement: Reimbursement) => {
    setEditingReimbursement(reimbursement);
    setIsDialogOpen(true);
  };
  
  const handleSaveReimbursement = async (data: Omit<Reimbursement, 'id' | 'addedBy' | 'status' | 'liquidatedAt' | 'liquidatedBy'>, id: string) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Firestore not available." });
      return;
    }

    const docRef = doc(firestore, 'reimbursements', id);
    await updateDoc(docRef, {
        ...data,
        dateIncurred: format(new Date(data.dateIncurred), "yyyy-MM-dd"),
    });

    toast({ title: "Reimbursement Updated", description: "The request has been successfully updated." });
    setIsDialogOpen(false);
  };

  const handleOpenDeleteDialog = (reimbursement: Reimbursement) => {
    setDeletingReimbursement(reimbursement);
    setIsAlertOpen(true);
  };

  const handleDeleteReimbursement = async () => {
    if (!deletingReimbursement || !firestore) return;

    try {
      if (deletingReimbursement.status === 'Liquidated') {
          // Allow deletion regardless of status
      }
      await deleteDoc(doc(firestore, "reimbursements", deletingReimbursement.id));
      toast({
        title: "Reimbursement Deleted",
        description: "The request has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Request",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsAlertOpen(false);
      setDeletingReimbursement(null);
    }
  };

  const handleDownload = (table: any) => {
      if (!table) return;
      const dataToExport = table.getFilteredRowModel().rows.map((row: { original: Reimbursement }) => {
          const reimbursement = row.original;
          const addedBy = users?.find(u => u.id === reimbursement.addedBy)?.name || reimbursement.addedBy;
          const liquidatedBy = users?.find(u => u.id === reimbursement.liquidatedBy)?.name || reimbursement.liquidatedBy;

          return {
              "Date Incurred": reimbursement.dateIncurred,
              "Category": reimbursement.category,
              "Description": reimbursement.description,
              "Amount": reimbursement.amount,
              "Credit To": reimbursement.creditedTo,
              "Status": reimbursement.status,
              "Added By": addedBy,
              "Liquidated By": liquidatedBy || 'N/A',
              "Liquidated At": reimbursement.liquidatedAt ? format(new Date(reimbursement.liquidatedAt), 'yyyy-MM-dd') : 'N/A',
              "Notes": reimbursement.notes,
          };
      });

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reimbursements-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  const isLoading = isLoadingReimbursements || isLoadingUsers;

  return (
    <>
    <div className="flex flex-col gap-6 w-full">
       <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Reimbursements & Liquidation</h1>
              <p className="text-muted-foreground">Manage and liquidate credit-based expense requests.</p>
          </div>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Pending & Liquidated Requests</CardTitle>
                <CardDescription>Review all reimbursement requests. Liquidate pending items to record them as official expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ReimbursementTable
                    data={reimbursements || []}
                    users={users || []}
                    isLoading={isLoading}
                    onLiquidate={handleLiquidate}
                    onEdit={handleEdit}
                    onDelete={handleOpenDeleteDialog}
                    onDownload={handleDownload}
                />
            </CardContent>
        </Card>
    </div>

    <ReimbursementDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveReimbursement}
        reimbursement={editingReimbursement}
      />
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the reimbursement request for <span className="font-bold">{deletingReimbursement?.description}</span>.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReimbursement} className="bg-destructive hover:bg-destructive/90">
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
