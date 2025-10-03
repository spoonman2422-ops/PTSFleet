
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Booking, BookingStatus, User } from '@/lib/types';
import { BookingTable } from '@/components/dispatcher/booking-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { BookingDialog } from '@/components/dispatcher/booking-dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageBoard } from '@/components/message-board';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/context/user-context';
import { vehicles } from '@/lib/data';

export default function DispatcherPage() {
  const firestore = useFirestore();
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'All'>('All');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const { user } = useUser();

  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingBooking(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDialogOpen(true);
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, 'id' | 'status'>, id?: string) => {
    if (!firestore) return;
    
    const dataToSave = {
      ...bookingData,
      bookingRate: Number(bookingData.bookingRate) || 0,
      driverRate: Number(bookingData.driverRate) || 0,
      expectedExpenses: {
        tollFee: Number(bookingData.expectedExpenses.tollFee) || 0,
        fuel: Number(bookingData.expectedExpenses.fuel) || 0,
        others: Number(bookingData.expectedExpenses.others) || 0,
      }
    }

    if (id) {
      // Update existing booking
      const bookingRef = doc(firestore, 'bookings', id);
      await updateDoc(bookingRef, dataToSave);

      toast({ title: "Booking Updated", description: `Booking #${id.substring(0, 4)} has been successfully updated.` });
      if(bookingData.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent for the updated assignment.` });
      }
    } else {
      // Create new booking
      const newBooking: Omit<Booking, 'id'> = {
        ...dataToSave,
        status: 'pending',
      };
      const docRef = await addDoc(collection(firestore, 'bookings'), newBooking);
      toast({ title: "Booking Created", description: `A new booking #${docRef.id.substring(0,4)} has been created.` });
       if(newBooking.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent to the assigned driver.` });
      }
    }
    setIsDialogOpen(false);
  };

   const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    if (!firestore || !bookings) return;

    const bookingRef = doc(firestore, 'bookings', bookingId);
    await updateDoc(bookingRef, { status });

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
            const invoiceData = {
                clientId: booking.clientId,
                bookingId: booking.id,
                amount: booking.bookingRate,
                dueDate: booking.dueDate,
                status: 'Unpaid',
            };
            const invoiceRef = await addDoc(collection(firestore, 'invoices'), invoiceData);
            toast({
                title: "Invoice Created",
                description: `Invoice #${invoiceRef.id.substring(0,4)} has been automatically created.`
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

  const filteredBookings = useMemo(() => {
    if (filterStatus === 'All') return sortedBookings;
    return sortedBookings.filter(b => b.status === filterStatus);
  }, [sortedBookings, filterStatus]);
  
  const handleRowClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };
  
  const drivers = useMemo(() => (users || []).filter(u => u.role === 'Driver'), [users]);


  return (
    <div className="grid md:grid-cols-3 gap-6 h-full">
      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Dispatcher Dashboard</h1>
              <p className="text-muted-foreground">Manage and track all bookings.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        <BookingTable
          bookings={filteredBookings}
          isLoading={isLoadingBookings || isLoadingUsers}
          onEdit={handleEdit}
          onUpdateStatus={handleUpdateStatus}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onRowClick={handleRowClick}
          selectedBookingId={selectedBookingId}
          users={users || []}
        />
      </div>
      
      <div className="md:col-span-1">
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
      />
    </div>
  );
}
