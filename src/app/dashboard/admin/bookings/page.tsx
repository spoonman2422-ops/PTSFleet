
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
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

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

            const grossSales = booking.bookingRate;
            let vatAmount = 0;
            let percentageTaxAmount = 0;
            let incomeTaxAmount = 0;

            if (vatRegistered) {
                // Business is VAT-registered
                vatAmount = grossSales * 0.12;
                percentageTaxAmount = 0; // Not applicable
            } else {
                // Business is NON-VAT registered
                vatAmount = 0; // Not applicable
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
            
            const invoiceData = {
                clientId: booking.clientId,
                bookingId: booking.id,
                grossSales: grossSales,
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

  const filteredBookings = useMemo(() => {
    let filtered = sortedBookings;
    if (filterStatus !== 'All') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(booking => {
            const driver = users?.find(u => u.id === booking.driverId);
            return (
                (booking.id && booking.id.substring(0, 4).toLowerCase().includes(lowercasedQuery)) ||
                (booking.clientId && booking.clientId.toLowerCase().includes(lowercasedQuery)) ||
                (driver && driver.name && driver.name.toLowerCase().includes(lowercasedQuery)) ||
                (booking.pickupLocation && booking.pickupLocation.toLowerCase().includes(lowercasedQuery)) ||
                (booking.dropoffLocation && booking.dropoffLocation.toLowerCase().includes(lowercasedQuery))
            );
        });
    }
    return filtered;
  }, [sortedBookings, filterStatus, searchQuery, users]);
  
  const handleRowClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };
  
  const drivers = useMemo(() => (users || []).filter(u => u.role === 'Driver'), [users]);


  return (
    <div className="grid md:grid-cols-3 gap-6 h-full">
      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
              <p className="text-muted-foreground">Manage and track all company bookings.</p>
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
