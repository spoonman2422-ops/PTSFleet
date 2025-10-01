"use client";

import { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { bookings as initialBookings, users } from '@/lib/data';
import type { Booking } from '@/lib/types';
import { BookingCard } from '@/components/driver/booking-card';
import { MessageBoard } from '@/components/message-board';

export default function DriverPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const driverBookings = useMemo(() => {
    if (!user) return [];
    return bookings
      .filter(b => b.driverId === user.id)
      .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());
  }, [user, bookings]);

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(currentBookings =>
      currentBookings.map(b => (b.id === bookingId ? { ...b, status } : b))
    );
  };
  
  if (!user) {
    return null;
  }
  
  const handleCardClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  }

  const selectedBooking = driverBookings.find(b => b.id === selectedBookingId);

  return (
    <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Assigned Bookings</h1>
                <p className="text-muted-foreground">Here are the jobs assigned to you. Click a job to view messages.</p>
            </div>

            {driverBookings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                {driverBookings.map(booking => (
                    <BookingCard
                        key={booking.id}
                        booking={booking}
                        onStatusChange={updateBookingStatus}
                        onClick={() => handleCardClick(booking.id)}
                        isSelected={selectedBookingId === booking.id}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No Bookings Assigned</h2>
                <p className="text-muted-foreground mt-2">Check back later for new assignments.</p>
                </div>
            )}
        </div>
        <div className="lg:col-span-1">
           {selectedBooking ? (
                <MessageBoard bookingId={selectedBooking.id} />
           ) : (
             <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg bg-muted/40 p-8">
                <p className="text-muted-foreground text-center">Select a booking to view and send messages to the dispatcher.</p>
            </div>
           )}
        </div>
    </div>
  );
}
