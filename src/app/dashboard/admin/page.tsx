
"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, Loader2, Wrench, FileCog } from "lucide-react";
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
import type { Booking, Invoice } from "@/lib/types";
import { format, parseISO, addDays, nextSunday, startOfMonth, addMonths, nextSaturday } from 'date-fns';


export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateData = async () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not available.",
      });
      return;
    }
    setIsUpdating(true);
    try {
        const batch = writeBatch(firestore);

        const bookingsSnapshot = await getDocs(collection(firestore, "bookings"));
        const invoicesSnapshot = await getDocs(collection(firestore, "invoices"));

        const allInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

        let updatedCount = 0;

        for (const bookingDoc of bookingsSnapshot.docs) {
            const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
            if (!booking.bookingDate || !booking.clientId) continue;

            const bookingDate = parseISO(booking.bookingDate);
            let newBillingDate: Date | null = null;
            let newDueDate: Date | null = null;

            if (booking.clientId === 'HANA Creatives') {
                newBillingDate = nextSunday(bookingDate);
                newDueDate = addDays(newBillingDate, 15);
            } else if (booking.clientId === 'Flash') {
                newBillingDate = startOfMonth(addMonths(bookingDate, 1));
                newDueDate = addDays(newBillingDate, 46);
            } else if (booking.clientId === 'DTS') {
                newBillingDate = nextSaturday(bookingDate);
                newDueDate = addDays(newBillingDate, 10);
            }

            if (newBillingDate && newDueDate) {
                const bookingRef = doc(firestore, "bookings", booking.id!);
                const updates: Partial<Booking> = {
                    billingDate: format(newBillingDate, "yyyy-MM-dd"),
                    dueDate: format(newDueDate, "yyyy-MM-dd"),
                };
                batch.update(bookingRef, updates);
                updatedCount++;
                
                // Find and update the corresponding invoice
                const correspondingInvoice = allInvoices.find(inv => inv.bookingId === booking.id);
                if (correspondingInvoice) {
                    const invoiceRef = doc(firestore, "invoices", correspondingInvoice.id);
                    batch.update(invoiceRef, { dueDate: format(newDueDate, "yyyy-MM-dd") });
                }
            }
        }
        
        if (updatedCount > 0) {
            await batch.commit();
            toast({
                title: "Data Update Complete",
                description: `${updatedCount} booking(s) and their corresponding invoices have been successfully updated.`,
            });
        } else {
             toast({
                title: "No Updates Needed",
                description: "All existing bookings already match the new date logic.",
            });
        }

    } catch (error: any) {
        console.error("Error updating data: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred while updating data.",
        });
    } finally {
        setIsUpdating(false);
    }
  };

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
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileCog className="h-6 w-6" />
                <span>Data Migration</span>
            </CardTitle>
            <CardDescription>
                Run one-time scripts to update existing data to match new application logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wrench className="mr-2 h-4 w-4" />
                  )}
                  {isUpdating ? "Updating..." : "Update Booking & Invoice Dates"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will scan all existing bookings and update their Billing and Due Dates based on the new client-specific rules. It will also update the due dates on corresponding invoices. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUpdateData}
                  >
                    Yes, update all records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-6 w-6" />
              <span>Data Management</span>
            </CardTitle>
            <CardDescription>
                Use this action to manage application data. This action is irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isResetting}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
