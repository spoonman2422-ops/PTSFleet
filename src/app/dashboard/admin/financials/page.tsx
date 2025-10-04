
"use client";

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, Invoice, Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, isAfter, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck2, Briefcase, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';


type ProfitFilter = 'Overall' | 'Annual' | 'Monthly' | 'Weekly';

export default function FinancialsPage() {
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>('expenses');

  const [profitFilter, setProfitFilter] = useState<ProfitFilter>('Overall');
  const [expenseFilter, setExpenseFilter] = useState<ProfitFilter>('Overall');


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

  const getStartDate = (filter: ProfitFilter) => {
    const today = new Date();
    switch(filter) {
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

  const profitTrackerData = useMemo(() => {
    if (!bookings) return [];
    
    const deliveredBookings = bookings
        .filter(b => b.status === 'Delivered' && b.dueDate);
    
    const startDate = getStartDate(profitFilter);

    return deliveredBookings
      .filter(booking => isAfter(parseISO(booking.dueDate), startDate))
      .map(booking => {
        const totalExpenses = (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
        const profit = booking.bookingRate - (booking.driverRate + totalExpenses);
        return { ...booking, profit };
      })
      .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());
  }, [bookings, profitFilter]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    const startDate = getStartDate(expenseFilter);
    return expenses
      .filter(expense => isAfter(parseISO(expense.dateIncurred), startDate))
      .sort((a, b) => parseISO(b.dateIncurred).getTime() - parseISO(a.dateIncurred).getTime());
  }, [expenses, expenseFilter]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [filteredExpenses]);
  
  const isLoading = isLoadingBookings || isLoadingInvoices || isLoadingExpenses;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Monitor your collections, outstanding payments, and profitability.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        
        <Card className="xl:col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span>Profit/Margin Tracker</span>
                    </CardTitle>
                    <Select value={profitFilter} onValueChange={(value) => setProfitFilter(value as ProfitFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Overall">Overall</SelectItem>
                            <SelectItem value="Annual">This Year</SelectItem>
                            <SelectItem value="Monthly">This Month</SelectItem>
                            <SelectItem value="Weekly">This Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-40 w-full" /> : profitTrackerData.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {profitTrackerData.map(booking => (
                        <TableRow key={booking.id}>
                        <TableCell>
                            <div className="font-medium">#{booking.id?.substring(0, 4)}</div>
                        </TableCell>
                        <TableCell>{booking.clientId}</TableCell>
                        <TableCell>{format(parseISO(booking.dueDate), 'PP')}</TableCell>
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

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        <span>Expense Tracker</span>
                    </CardTitle>
                    <Select value={expenseFilter} onValueChange={(value) => setExpenseFilter(value as ProfitFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Overall">Overall</SelectItem>
                            <SelectItem value="Annual">This Year</SelectItem>
                            <SelectItem value="Monthly">This Month</SelectItem>
                            <SelectItem value="Weekly">This Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-40 w-full" /> : filteredExpenses.length > 0 ? (
                <>
                <div className="max-h-64 overflow-y-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredExpenses.map(expense => (
                        <TableRow key={expense.id}>
                            <TableCell>{format(parseISO(expense.dateIncurred), 'PP')}</TableCell>
                            <TableCell className="capitalize">{expense.category}</TableCell>
                            <TableCell className="text-right font-medium">
                                ₱{expense.amount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end text-right">
                    <div>
                        <p className="text-muted-foreground">Total Expenses</p>
                        <p className="font-bold text-xl">₱{totalExpenses.toLocaleString()}</p>
                    </div>
                </div>
                </>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No expenses logged for this period.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    