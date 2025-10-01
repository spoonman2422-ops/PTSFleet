"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { bookings as initialBookings, users } from '@/lib/data';
import type { Booking } from '@/lib/types';
import { BookingCard } from '@/components/driver/booking-card';

export default function DriverPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Assigned Bookings</h1>
        <p className="text-muted-foreground">Here are the jobs assigned to you. Please update the status as you progress.</p>
      </div>

      {driverBookings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {driverBookings.map(booking => {
            const vehicle = booking.vehicleId ? users.find(u => u.id === booking.vehicleId) : null;
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                onStatusChange={updateBookingStatus}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Bookings Assigned</h2>
          <p className="text-muted-foreground mt-2">Check back later for new assignments.</p>
        </div>
      )}
    </div>
  );
}
