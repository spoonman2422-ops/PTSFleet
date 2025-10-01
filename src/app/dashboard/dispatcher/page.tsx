
"use client";

import { useState, useMemo } from 'react';
import type { Booking, BookingStatus } from '@/lib/types';
import { BookingTable } from '@/components/dispatcher/booking-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { BookingDialog } from '@/components/dispatcher/booking-dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageBoard } from '@/components/message-board';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/context/user-context';
import { users, vehicles } from '@/lib/data';

export default function DispatcherPage() {
  const firestore = useFirestore();
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  
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
    
    if (id) {
      // Update existing booking
      const bookingRef = doc(firestore, 'bookings', id);
      await updateDoc(bookingRef, bookingData);

      toast({ title: "Booking Updated", description: `Booking #${id.substring(0, 4)} has been successfully updated.` });
      if(bookingData.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent for the updated assignment.` });
      }
    } else {
      // Create new booking
      const newBooking: Omit<Booking, 'id'> = {
        ...bookingData,
        status: 'Pending',
      };
      const docRef = await addDoc(collection(firestore, 'bookings'), newBooking);
      toast({ title: "Booking Created", description: `A new booking #${docRef.id.substring(0,4)} has been created.` });
       if(newBooking.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent to the assigned driver.` });
      }
    }
  };

   const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    if (!firestore) return;

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
     }
  };
  
  const sortedBookings = useMemo(() => {
    return (bookings || []).sort((a, b) => {
      const dateA = a.pickupTime ? new Date(a.pickupTime).getTime() : 0;
      const dateB = b.pickupTime ? new Date(b.pickupTime).getTime() : 0;
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
          isLoading={isLoadingBookings}
          onEdit={handleEdit}
          onUpdateStatus={handleUpdateStatus}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onRowClick={handleRowClick}
          selectedBookingId={selectedBookingId}
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
        drivers={users.filter(u => u.role === 'Driver')}
        vehicles={vehicles}
      />
    </div>
  );
}
