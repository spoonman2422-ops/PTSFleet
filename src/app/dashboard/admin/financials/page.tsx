
"use client";

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, isAfter, parseISO, differenceInDays } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck2, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancialsPage() {
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');

  const now = new Date();
  const nextSevenDays = addDays(now, 7);

  const upcomingCollections = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter(b => b.collectionDate && isAfter(parseISO(b.collectionDate), now) && isBefore(parseISO(b.collectionDate), nextSevenDays))
      .sort((a, b) => parseISO(a.collectionDate).getTime() - parseISO(b.collectionDate).getTime());
  }, [bookings, now, nextSevenDays]);

  const outstandingPayments = useMemo(() => {
    if (!invoices || !bookings) return [];
    return invoices
      .filter(inv => {
        const isPastDue = isBefore(parseISO(inv.dueDate), now);
        return isPastDue && (inv.status === 'Unpaid' || inv.status === 'Overdue');
      })
      .map(inv => {
        const booking = bookings.find(b => b.id === inv.bookingId);
        return { invoice: inv, booking };
      })
      .sort((a, b) => parseISO(a.invoice.dueDate).getTime() - parseISO(b.invoice.dueDate).getTime());
  }, [invoices, bookings, now]);

  const profitTrackerData = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter(b => b.status === 'Delivered')
      .map(booking => {
        const totalExpenses = (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
        const profit = booking.bookingRate - (booking.driverRate + totalExpenses);
        return { ...booking, profit };
      })
      .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime())
      .slice(0, 10); // Show top 10 most recently completed
  }, [bookings]);
  
  const isLoading = isLoadingBookings || isLoadingInvoices;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Monitor your collections, outstanding payments, and profitability.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Collections */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck2 className="h-5 w-5 text-blue-500" />
              <span>Upcoming Collections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : upcomingCollections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingCollections.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">#{booking.id?.substring(0, 4)}</div>
                        <div className="text-xs text-muted-foreground">{differenceInDays(parseISO(booking.collectionDate), now)} days</div>
                      </TableCell>
                      <TableCell>{booking.clientId}</TableCell>
                      <TableCell className="text-right font-medium">₱{booking.bookingRate.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-10">No collections in the next 7 days.</p>}
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Outstanding Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-40 w-full" /> : outstandingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingPayments.map(({ invoice, booking }) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">#{invoice.id.substring(0, 4)}</div>
                        <div className="text-xs text-destructive">{differenceInDays(now, parseISO(invoice.dueDate))} days overdue</div>
                      </TableCell>
                       <TableCell>{booking?.clientId || invoice.clientId}</TableCell>
                      <TableCell className="text-right font-medium">₱{invoice.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-10">No outstanding payments.</p>}
          </CardContent>
        </Card>

        {/* Profit Tracker */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Recent Profit Tracker</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-40 w-full" /> : profitTrackerData.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {profitTrackerData.map(booking => (
                        <TableRow key={booking.id}>
                        <TableCell>
                            <div className="font-medium">#{booking.id?.substring(0, 4)}</div>
                            <div className="text-xs text-muted-foreground">{booking.clientId}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            <span className={booking.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ₱{booking.profit.toLocaleString()}
                            </span>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No delivered bookings to analyze.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

