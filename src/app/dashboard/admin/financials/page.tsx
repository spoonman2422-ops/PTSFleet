
"use client";

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, isAfter, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck2, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ProfitFilter = 'Overall' | 'Annual' | 'Monthly' | 'Weekly';

export default function FinancialsPage() {
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>('Overall');


  const now = new Date();
  const nextSevenDays = addDays(now, 7);

  const upcomingCollections = useMemo(() => {
    if (!bookings || !invoices) return [];
    return bookings
      .filter(b => {
        const invoice = invoices.find(inv => inv.bookingId === b.id);
        if (invoice && invoice.status === 'Paid') {
          return false;
        }
        return b.collectionDate && isAfter(parseISO(b.collectionDate), now) && isBefore(parseISO(b.collectionDate), nextSevenDays)
      })
      .sort((a, b) => parseISO(a.collectionDate).getTime() - parseISO(b.collectionDate).getTime());
  }, [bookings, invoices, now, nextSevenDays]);
  
  const completedCollections = useMemo(() => {
    if (!invoices || !bookings) return [];
    return invoices
      .filter(inv => inv.status === 'Paid')
      .map(inv => {
        const booking = bookings.find(b => b.id === inv.bookingId);
        return { invoice: inv, booking };
      })
      .sort((a, b) => {
        const dateA = a.invoice.createdAt ? a.invoice.createdAt.toMillis() : 0;
        const dateB = b.invoice.createdAt ? b.invoice.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
  }, [invoices, bookings]);


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
    
    const deliveredBookings = bookings
        .filter(b => b.status === 'Delivered' && b.dueDate);

    const getStartDate = () => {
        const today = new Date();
        switch(profitFilter) {
            case 'Weekly':
                return startOfWeek(today);
            case 'Monthly':
                return startOfMonth(today);
            case 'Annual':
                return startOfYear(today);
            case 'Overall':
            default:
                return new Date(0); // The beginning of time
        }
    };
    
    const startDate = getStartDate();

    return deliveredBookings
      .filter(booking => isAfter(parseISO(booking.dueDate), startDate))
      .map(booking => {
        const totalExpenses = (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
        const profit = booking.bookingRate - (booking.driverRate + totalExpenses);
        return { ...booking, profit };
      })
      .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());
  }, [bookings, profitFilter]);
  
  const isLoading = isLoadingBookings || isLoadingInvoices;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Monitor your collections, outstanding payments, and profitability.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Upcoming Collections */}
        <Card>
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
        
        {/* Completed Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-green-500" />
              <span>Completed Collections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : completedCollections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedCollections.map(({ invoice, booking }) => (
                    <TableRow key={invoice.id}>
                       <TableCell>
                        <div className="font-medium">#{invoice.id?.substring(0, 4)}</div>
                        <div className="text-xs text-muted-foreground">
                            {invoice.createdAt ? format(invoice.createdAt.toDate(), 'PP') : ''}
                        </div>
                      </TableCell>
                      <TableCell>{booking?.clientId || invoice.clientId}</TableCell>
                      <TableCell className="text-right font-medium">₱{invoice.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-10">No completed collections yet.</p>}
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Profit/Margin Tracker</span>
            </CardTitle>
             <Tabs value={profitFilter} onValueChange={(value) => setProfitFilter(value as ProfitFilter)}>
                <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger value="Overall">Overall</TabsTrigger>
                    <TabsTrigger value="Annual">Annual</TabsTrigger>
                    <TabsTrigger value="Monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="Weekly">Weekly</TabsTrigger>
                </TabsList>
            </Tabs>
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
             ) : <p className="text-sm text-muted-foreground text-center py-10">No delivered bookings to analyze for this period.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


    
