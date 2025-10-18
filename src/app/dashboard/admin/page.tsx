
"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, Loader2, Wrench } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Expense } from "@/lib/types";

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleResetData = async () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not available.",
      });
      return;
    }

    setIsResetting(true);
    try {
      const collectionsToDelete = [
        "bookings",
        "invoices",
        "expenses",
        "cashAdvances",
        "revolvingFundContributions",
      ];
      
      const batch = writeBatch(firestore);

      for (const collectionName of collectionsToDelete) {
        const collectionRef = collection(firestore, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        
        if (collectionName === "bookings") {
            for (const doc of querySnapshot.docs) {
                const messagesRef = collection(firestore, `bookings/${doc.id}/messages`);
                const messagesSnapshot = await getDocs(messagesRef);
                messagesSnapshot.forEach(messageDoc => {
                    batch.delete(messageDoc.ref);
                });
                batch.delete(doc.ref);
            }
        } else {
             querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
             });
        }
      }

      await batch.commit();

      toast({
        title: "Application Data Reset",
        description: "All transactional data has been successfully cleared.",
      });
    } catch (error: any) {
      console.error("Error resetting data: ", error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCleanupExpenses = async () => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Firestore is not available." });
      return;
    }

    setIsCleaning(true);

    try {
        const batch = writeBatch(firestore);
        
        // 1. Delete all expenses linked to a booking
        const expensesQuery = query(collection(firestore, "expenses"), where("bookingId", "!=", null));
        const expensesSnapshot = await getDocs(expensesQuery);
        let deletedCount = 0;
        expensesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            deletedCount++;
        });

        // 2. Fetch all bookings
        const bookingsRef = collection(firestore, "bookings");
        const bookingsSnapshot = await getDocs(bookingsRef);
        
        let createdCount = 0;
        // 3. Re-create expenses for each booking
        for (const bookingDoc of bookingsSnapshot.docs) {
            const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
            
            const createExpense = (category: Expense['category'], amount: number) => {
                if (amount > 0) {
                    const expenseData = {
                        bookingId: booking.id,
                        category,
                        description: `Mobilization Expense for Booking #${(booking.id || '').substring(0,7)}`,
                        amount,
                        vatIncluded: false,
                        vatRate: 0,
                        inputVat: 0,
                        dateIncurred: booking.bookingDate,
                        paidBy: "PTS" as const,
                        addedBy: "system_cleanup", // Differentiate system-generated expenses
                        notes: `Automatically generated during cleanup`,
                    };
                    const expenseRef = doc(collection(firestore, "expenses"));
                    batch.set(expenseRef, expenseData);
                    createdCount++;
                }
            };
            
            createExpense("driver rate", booking.driverRate);
            createExpense("toll", booking.expectedExpenses.tollFee);
            createExpense("fuel", booking.expectedExpenses.fuel);
            createExpense("client representation", booking.expectedExpenses.others);
        }

        await batch.commit();

        toast({
            title: "Expense Cleanup Complete",
            description: `${deletedCount} old expenses deleted and ${createdCount} new expenses created.`,
        });

    } catch (error: any) {
         console.error("Error cleaning up expenses: ", error);
         toast({
            variant: "destructive",
            title: "Cleanup Failed",
            description: error.message || "An unexpected error occurred.",
         });
    } finally {
        setIsCleaning(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              <span>Admin Panel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Welcome, Admin. This is where administrative controls and system overview will be displayed.</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-6 w-6" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>
                Use these actions to manage application data. These actions are irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isResetting || isCleaning}>
                  {isResetting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isResetting ? "Resetting..." : "Reset Application Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all bookings, invoices, expenses, cash advances, and fund contributions. 
                    <strong className="font-bold"> User accounts will not be deleted.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, delete all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                 <Button variant="outline" disabled={isResetting || isCleaning}>
                  {isCleaning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wrench className="mr-2 h-4 w-4" />
                  )}
                  {isCleaning ? "Cleaning..." : "Clean Up Booking Expenses"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clean up booking expenses?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all expenses created from bookings and recreate them correctly. This is useful for fixing past data inconsistencies. 
                    <strong className="font-bold"> Expenses logged manually will not be affected.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanupExpenses}
                  >
                    Yes, clean up expenses
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
