"use client";

import { useState, useMemo } from 'react';
import { bookings as initialBookings, users, vehicles } from '@/lib/data';
import type { Booking, BookingStatus } from '@/lib/types';
import { BookingTable } from '@/components/dispatcher/booking-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { BookingDialog } from '@/components/dispatcher/booking-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DispatcherPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'All'>('All');

  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingBooking(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDialogOpen(true);
  };

  const handleSaveBooking = (bookingData: Omit<Booking, 'id' | 'status'>, id?: string) => {
    if (id) {
      // Update existing booking
      setBookings(current =>
        current.map(b => b.id === id ? { ...b, ...bookingData } : b)
      );
      toast({ title: "Booking Updated", description: `Booking #${id.split('-')[1]} has been successfully updated.` });
      if(bookingData.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent for the updated assignment.` });
      }
    } else {
      // Create new booking
      const newBooking: Booking = {
        ...bookingData,
        id: `booking-${Date.now()}`,
        status: 'Pending',
      };
      setBookings(current => [newBooking, ...current]);
      toast({ title: "Booking Created", description: `A new booking has been created.` });
       if(newBooking.driverId) {
        toast({ title: "Driver Notified", description: `A notification has been sent to the assigned driver.` });
      }
    }
  };

   const handleUpdateStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(currentBookings =>
      currentBookings.map(b => (b.id === bookingId ? { ...b, status } : b))
    );
     toast({ title: "Status Updated", description: `Booking status changed to ${status}.` });
  };
  
  const filteredBookings = useMemo(() => {
    if (filterStatus === 'All') return bookings;
    return bookings.filter(b => b.status === filterStatus);
  }, [bookings, filterStatus]);

  return (
    <div className="flex flex-col gap-6 h-full">
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
        onEdit={handleEdit}
        onUpdateStatus={handleUpdateStatus}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

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
