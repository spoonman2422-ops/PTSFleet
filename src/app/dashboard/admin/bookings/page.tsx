
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Booking, BookingStatus, User, Expense } from '@/lib/types';
import { BookingTable } from '@/components/dispatcher/booking-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, PanelRight, PanelLeft } from 'lucide-react';
import { BookingDialog } from '@/components/dispatcher/booking-dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageBoard } from '@/components/message-board';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { useUser } from '@/context/user-context';
import { vehicles } from '@/lib/data';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';


export default function AdminBookingsPage() {
  const firestore = useFirestore();
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'All'>('All');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isMessageBoardVisible, setIsMessageBoardVisible] = useState(true);

  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingBooking(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (booking: Booking) => {
    setDeletingBooking(booking);
    setIsAlertOpen(true);
  };

  const handleDeleteBooking = async () => {
    if (!deletingBooking || !firestore) return;

    try {
      const batch = writeBatch(firestore);

      // 1. Delete associated expenses
      const expensesQuery = query(collection(firestore, "expenses"), where("bookingId", "==", deletingBooking.id));
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 2. Delete messages subcollection
      const messagesPath = `bookings/${deletingBooking.id}/messages`;
      const messagesSnapshot = await getDocs(collection(firestore, messagesPath));
      messagesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 3. Delete the booking document itself
      const bookingRef = doc(firestore, 'bookings', deletingBooking.id!);
      batch.delete(bookingRef);

      await batch.commit();


      toast({
        title: 'Booking Deleted',
        description: `Booking #${deletingBooking.id!.substring(0, 7)} and all its associated data have been deleted.`,
      });

      if (selectedBookingId === deletingBooking.id) {
          setSelectedBookingId(null);
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete booking',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsAlertOpen(false);
      setDeletingBooking(null);
    }
  };


  const createExpenseFromBooking = async (
    bookingData: Omit<Booking, 'status' | 'id'>,
    bookingId: string,
    category: Expense['category'],
    amount: number
  ) => {
    if (!firestore || !user || !amount || amount <= 0) return;

    const expenseData = {
      bookingId,
      category,
      description: `Mobilization Expense for Booking #${bookingId.substring(0,7)}`,
      amount: amount,
      vatIncluded: false,
      vatRate: 0,
      inputVat: 0,
      dateIncurred: bookingData.bookingDate,
      paidBy: "PTS" as const,
      addedBy: user.id,
      notes: `Automatically generated from booking ${bookingId.substring(0,7)}`,
    };
    await addDoc(collection(firestore, "expenses"), expenseData);
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, 'status' | 'id'>, id: string) => {
    if (!firestore || !user) return;
    
    const dataToSave = {
      ...bookingData,
      grossBookingRate: Number(bookingData.grossBookingRate) || 0,
      bookingRate: Number(bookingData.bookingRate) || 0,
      driverRate: Number(bookingData.driverRate) || 0,
      expectedExpenses: {
        tollFee: Number(bookingData.expectedExpenses.tollFee) || 0,
        fuel: Number(bookingData.expectedExpenses.fuel) || 0,
        others: Number(bookingData.expectedExpenses.others) || 0,
      }
    };
    
    const isEditing = !!editingBooking;
    const bookingRef = doc(firestore, 'bookings', id);

    // --- Delete old expenses before creating new ones ---
    if (isEditing) {
      const expensesQuery = query(collection(firestore, "expenses"), where("bookingId", "==", id));
      const expensesSnapshot = await getDocs(expensesQuery);
      const batch = writeBatch(firestore);
      expensesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();
    }
    // --- End of delete logic ---

    if (isEditing) {
      await updateDoc(bookingRef, dataToSave);
      toast({ title: "Booking Updated", description: `Booking #${id.substring(0, 7)} has been successfully updated.` });
      if(bookingData.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent for the updated assignment.` });
      }
    } else {
      const newBooking: Omit<Booking, 'id'> = {
        ...dataToSave,
        status: 'pending',
      };
      await setDoc(bookingRef, newBooking);
      toast({ title: "Booking Created", description: `A new booking #${id.substring(0,7)} has been created.` });
       if(newBooking.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent to the assigned driver.` });
      }
    }

    // Create expense entries for both new and updated bookings
    await createExpenseFromBooking(dataToSave, id, "driver rate", dataToSave.driverRate);
    await createExpenseFromBooking(dataToSave, id, "toll", dataToSave.expectedExpenses.tollFee);
    await createExpenseFromBooking(dataToSave, id, "fuel", dataToSave.expectedExpenses.fuel);
    await createExpenseFromBooking(dataToSave, id, "client representation", dataToSave.expectedExpenses.others);
    
    setIsDialogOpen(false);
  };

   const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    if (!firestore || !bookings) return;

    const bookingRef = doc(firestore, 'bookings', bookingId);
    
    const updateData: { status: BookingStatus; completionDate?: string } = { status };
    if (status === 'Delivered') {
      updateData.completionDate = format(new Date(), 'yyyy-MM-dd');
    }
    await updateDoc(bookingRef, updateData);

    toast({ title: "Status Updated", description: `Booking status changed to ${status}.` });

     if (status === 'Delivered' && user && firestore) {
        const messagesPath = `bookings/${bookingId}/messages`;
        const messageData = {
            text: `Dispatcher ${user.name} has confirmed the delivery for booking #${bookingId.substring(0, 4)}. Great job!`,
            senderId: 'system',
            senderName: 'System Bot',
            bookingId: bookingId,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, messagesPath), messageData);

        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            // --- TAX COMPUTATION LOGIC ---
            const vatRegistered = false; 
            const incomeTaxOption = '8_percent_flat'; 

            const grossSales = booking.grossBookingRate;
            let vatAmount = 0;
            let percentageTaxAmount = 0;
            let incomeTaxAmount = 0;

            if (vatRegistered) {
                // Business is VAT-registered
                vatAmount = grossSales * 0.12;
                percentageTaxAmount = 0; // Not applicable for VAT-registered
            } else {
                // Business is NON-VAT registered
                vatAmount = 0; // Not applicable for NON-VAT
                // The 3% percentage tax is NOT applicable if the 8% flat income tax is chosen
                percentageTaxAmount = incomeTaxOption === 'graduated' ? grossSales * 0.03 : 0;
            }

            if (incomeTaxOption === '8_percent_flat') {
                // The 8% is on gross sales in excess of 250,000
                const taxableIncome = Math.max(0, grossSales - 250000);
                incomeTaxAmount = taxableIncome * 0.08;
            } else {
                // Graduated income tax simulation on net taxable income
                // Note: For a real scenario, this would be `grossSales - totalDeductibleExpenses`
                const taxableIncome = grossSales; 
                if (taxableIncome <= 250000) incomeTaxAmount = 0;
                else if (taxableIncome <= 400000) incomeTaxAmount = (taxableIncome - 250000) * 0.15;
                else if (taxableIncome <= 800000) incomeTaxAmount = 22500 + (taxableIncome - 400000) * 0.20;
                else if (taxableIncome <= 2000000) incomeTaxAmount = 102500 + (taxableIncome - 800000) * 0.25;
                else if (taxableIncome <= 8000000) incomeTaxAmount = 402500 + (taxableIncome - 2000000) * 0.30;
                else incomeTaxAmount = 2202500 + (taxableIncome - 8000000) * 0.35;
            }

            const totalTaxes = vatAmount + percentageTaxAmount + incomeTaxAmount;
            const netRevenue = grossSales - totalTaxes;
            
            const ewtAmount = booking.ewtApplied ? booking.grossBookingRate * 0.02 : 0;

            const invoiceData = {
                clientId: booking.clientId,
                bookingId: booking.id,
                grossSales: booking.grossBookingRate,
                ewtApplied: booking.ewtApplied,
                ewtAmount: ewtAmount,
                vatRegistered: vatRegistered,
                vatRate: 0.12,
                vatAmount: vatAmount,
                percentageTaxRate: 0.03,
                percentageTaxAmount: percentageTaxAmount,
                incomeTaxOption: incomeTaxOption,
                incomeTaxAmount: incomeTaxAmount,
                netRevenue: netRevenue,
                dateIssued: new Date().toISOString(),
                dueDate: booking.dueDate,
                status: 'Unpaid',
            };
            const invoiceRef = await addDoc(collection(firestore, 'invoices'), invoiceData);
            toast({
                title: "Invoice Created",
                description: `Invoice #${invoiceRef.id.substring(0,4)} has been automatically generated with tax computations.`
            });
        }
     }
  };
  
  const sortedBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.sort((a, b) => {
      const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
      const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [bookings]);

  const filteredByStatus = useMemo(() => {
    if (filterStatus === 'All') return sortedBookings;
    return sortedBookings.filter(b => b.status === filterStatus);
  }, [sortedBookings, filterStatus]);
  
  const handleRowClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (!isMessageBoardVisible) {
        setIsMessageBoardVisible(true);
    }
  };
  
  const drivers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => u.role === 'Driver')
  }, [users]);


  return (
    <div className={cn("grid gap-6 h-full transition-all", isMessageBoardVisible ? "md:grid-cols-3" : "md:grid-cols-1")}>
      <div className={cn("flex flex-col gap-6", isMessageBoardVisible ? "md:col-span-2" : "md:col-span-1")}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
              <p className="text-muted-foreground">Manage and track all company bookings.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Booking
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsMessageBoardVisible(!isMessageBoardVisible)}>
                {isMessageBoardVisible ? <PanelRight /> : <PanelLeft />}
            </Button>
          </div>
        </div>

        <BookingTable
          bookings={filteredByStatus}
          isLoading={isLoadingBookings || isLoadingUsers}
          onEdit={handleEdit}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleOpenDeleteDialog}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onRowClick={handleRowClick}
          selectedBookingId={selectedBookingId}
          users={users || []}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
      
      <div className={cn("md:col-span-1 transition-all", !isMessageBoardVisible && "hidden")}>
        {selectedBookingId ? (
            <MessageBoard bookingId={selectedBookingId} />
        ) : (
            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg bg-muted/40">
                <p className="text-muted-foreground">Select a booking to view messages</p>
            </div>
        )}
      </div>


      <BookingDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveBooking}
        booking={editingBooking}
        drivers={drivers}
        vehicles={vehicles}
        allBookings={bookings || []}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete booking{' '}
            <span className="font-bold">#{(deletingBooking?.id || '').substring(0, 7).toUpperCase()}</span> and all its associated data.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBooking} className="bg-destructive hover:bg-destructive/90">
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
