
      
"use client";

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, Invoice, Expense, RevolvingFundContribution, User, Vehicle, VehicleType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, isAfter, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck2, Briefcase, Wallet, CheckCircle, LandPlot, HandCoins, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { vehicles } from '@/lib/data';


type FinancialFilter = 'Overall' | 'Annual' | 'Monthly' | 'Weekly';

export default function FinancialsPage() {
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>('expenses');
  const { data: contributions, isLoading: isLoadingContributions } = useCollection<RevolvingFundContribution>('revolvingFundContributions');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');


  const [profitFilter, setProfitFilter] = useState<FinancialFilter>('Overall');
  const [expenseFilter, setExpenseFilter] = useState<FinancialFilter>('Overall');
  const [taxFilter, setTaxFilter] = useState<FinancialFilter>('Overall');
  const [cashOnHandFilter, setCashOnHandFilter] = useState<FinancialFilter>('Overall');
  const [vehicleProfitFilter, setVehicleProfitFilter] = useState<FinancialFilter>('Overall');


  const now = new Date();
  const nextSevenDays = addDays(now, 7);

  const getStartDate = (filter: FinancialFilter) => {
    const today = new Date();
    switch(filter) {
        case 'Weekly':
            return startOfWeek(today, { weekStartsOn: 1 });
        case 'Monthly':
            return startOfMonth(today);
        case 'Annual':
            return startOfYear(today);
        case 'Overall':
        default:
            return new Date(0); // The beginning of time
    }
  };


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
         const dateA = a.invoice.dateIssued ? parseISO(a.invoice.dateIssued).getTime() : 0;
         const dateB = b.invoice.dateIssued ? parseISO(b.invoice.dateIssued).getTime() : 0;
         return dateB - dateA;
      });
  }, [invoices, bookings]);


  const outstandingPayments = useMemo(() => {
    if (!invoices || !bookings) return [];
    return invoices
      .filter(inv => {
        if (!inv.dueDate) return false;
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
    
    const startDate = getStartDate(profitFilter);

    return deliveredBookings
      .filter(booking => booking.dueDate && isAfter(parseISO(booking.dueDate), startDate))
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
      .filter(expense => expense.dateIncurred && isAfter(parseISO(expense.dateIncurred), startDate))
      .sort((a, b) => parseISO(b.dateIncurred).getTime() - parseISO(a.dateIncurred).getTime());
  }, [expenses, expenseFilter]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [filteredExpenses]);

  const taxSummaryData = useMemo(() => {
    const startDate = getStartDate(taxFilter);
    const relevantInvoices = (invoices || []).filter(inv => inv.dateIssued && isAfter(parseISO(inv.dateIssued), startDate));
    const relevantExpenses = (expenses || []).filter(exp => exp.dateIncurred && isAfter(parseISO(exp.dateIncurred), startDate));

    const outputVat = relevantInvoices
      .filter(inv => inv.vatRegistered)
      .reduce((acc, inv) => acc + inv.vatAmount, 0);

    const inputVat = relevantExpenses
      .filter(exp => exp.vatIncluded)
      .reduce((acc, exp) => acc + exp.inputVat, 0);

    const percentageTax = relevantInvoices
      .filter(inv => !inv.vatRegistered)
      .reduce((acc, inv) => acc + inv.percentageTaxAmount, 0);
    
    const incomeTax = relevantInvoices.reduce((acc, inv) => acc + inv.incomeTaxAmount, 0);

    return {
      outputVat,
      inputVat,
      vatPayable: outputVat - inputVat,
      percentageTax,
      incomeTax,
    }
  }, [invoices, expenses, taxFilter]);

  const cashOnHandData = useMemo(() => {
    if (!invoices || !expenses || !contributions || !bookings) {
        return { totalCollections: 0, totalExpenses: 0, totalRevolvingFund: 0, cashOnHand: 0 };
    }
    const startDate = getStartDate(cashOnHandFilter);

    const paidInvoices = (invoices || [])
        .filter(inv => inv.status === 'Paid' && inv.dateIssued && isAfter(parseISO(inv.dateIssued), startDate));
    
    const totalNetCollections = paidInvoices.reduce((sum, inv) => {
        const booking = bookings.find(b => b.id === inv.bookingId);
        if (!booking) return sum;

        const bookingExpenses = (booking.driverRate || 0) +
                                (booking.expectedExpenses?.tollFee || 0) +
                                (booking.expectedExpenses?.fuel || 0) +
                                (booking.expectedExpenses?.others || 0);

        const netFromBooking = booking.bookingRate - bookingExpenses;
        return sum + netFromBooking;
    }, 0);

    const totalExpenses = (expenses || [])
        .filter(exp => exp.dateIncurred && isAfter(parseISO(exp.dateIncurred), startDate))
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalRevolvingFund = (contributions || [])
        .filter(c => c.contributionDate && isAfter(parseISO(c.contributionDate), startDate))
        .reduce((sum, c) => sum + c.amount, 0);
    
    // Here we consider totalExpenses already includes the ones from bookings,
    // so we use totalNetCollections which is gross sales - booking-specific expenses.
    // If expenses from bookings are NOT in the main expenses list, we need to adjust.
    // Based on previous work, booking expenses ARE added to the expenses collection.
    // So `totalExpenses` is the grand total.
    // The cash inflow is from collections (gross) and revolving fund.
    const totalCashIn = paidInvoices.reduce((sum, inv) => sum + inv.grossSales, 0) + totalRevolvingFund;
    const cashOnHand = totalCashIn - totalExpenses;

    return { 
        totalRevolvingFund, 
        totalCollections: paidInvoices.reduce((sum, inv) => sum + inv.grossSales, 0), 
        totalExpenses, 
        cashOnHand 
    };
}, [invoices, expenses, contributions, bookings, cashOnHandFilter]);
  
  const vehicleProfitabilityData = useMemo(() => {
    if (!bookings) return [];

    const startDate = getStartDate(vehicleProfitFilter);
    const deliveredBookings = bookings.filter(b => 
      b.status === 'Delivered' && 
      b.completionDate && 
      isAfter(parseISO(b.completionDate), startDate) &&
      b.vehicleType
    );

    const profitByVehicleType: Record<string, {
        vehicleType: VehicleType;
        totalBookings: number;
        totalRevenue: number;
        totalCosts: number;
        netProfit: number;
    }> = {};

    for (const booking of deliveredBookings) {
        const vehicleType = booking.vehicleType;
        if (!vehicleType) continue;

        if (!profitByVehicleType[vehicleType]) {
            profitByVehicleType[vehicleType] = {
                vehicleType,
                totalBookings: 0,
                totalRevenue: 0,
                totalCosts: 0,
                netProfit: 0
            };
        }

        const costs = booking.driverRate + (booking.expectedExpenses?.fuel || 0) + (booking.expectedExpenses?.tollFee || 0) + (booking.expectedExpenses?.others || 0);
        const profit = booking.bookingRate - costs;

        profitByVehicleType[vehicleType].totalBookings += 1;
        profitByVehicleType[vehicleType].totalRevenue += booking.bookingRate;
        profitByVehicleType[vehicleType].totalCosts += costs;
        profitByVehicleType[vehicleType].netProfit += profit;
    }

    return Object.values(profitByVehicleType).sort((a, b) => b.netProfit - a.netProfit);
}, [bookings, vehicleProfitFilter]);

  const isLoading = isLoadingBookings || isLoadingInvoices || isLoadingExpenses || isLoadingContributions || isLoadingUsers;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Monitor your collections, outstanding payments, and profitability.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck2 className="h-5 w-5 text-blue-500" />
                <span>Upcoming Collections (Next 7 Days)</span>
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
                        <div className="font-medium">#{(booking.id || '').substring(0,7)}</div>
                        <div className="text-xs text-muted-foreground">{format(parseISO(booking.collectionDate), 'PP')}</div>
                      </TableCell>
                      <TableCell>{booking.clientId}</TableCell>
                      <TableCell className="text-right">₱{booking.bookingRate.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground text-center py-10">No upcoming collections in the next 7 days.</p>}
          </CardContent>
        </Card>

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
                            <TableHead>Details</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Days Overdue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {outstandingPayments.map(({ invoice, booking }) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <div className="font-medium">Inv #{invoice.id.substring(0, 7)}</div>
                                    <div className="text-xs text-muted-foreground">Book #{(booking?.id || '').substring(0,7)}</div>
                                </TableCell>
                                <TableCell>{booking?.clientId || invoice.clientId}</TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                    {differenceInDays(now, parseISO(invoice.dueDate))} days
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No outstanding payments. Good job!</p>}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-500"/>
                    <span>Completed Collections</span>
                </CardTitle>
                <CardDescription>Recently paid invoices.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-40 w-full" /> : completedCollections.length > 0 ? (
                    <div className="space-y-4">
                        {completedCollections.slice(0, 5).map(({ invoice, booking }) => (
                            <div key={invoice.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">#{invoice.id.substring(0, 7)}</p>
                                    <p className="text-sm text-muted-foreground">{booking?.clientId || invoice.clientId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">+{formatCurrency(invoice.grossSales)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {invoice.dateIssued ? format(parseISO(invoice.dateIssued), 'PP') : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-muted-foreground text-center py-10">No completed collections yet.</p>}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <HandCoins className="h-5 w-5 text-purple-500" />
                        <span>Cash on Hand</span>
                    </CardTitle>
                    <Select value={cashOnHandFilter} onValueChange={(value) => setCashOnHandFilter(value as FinancialFilter)}>
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
                {isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-2">
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Revolving Fund</span>
                          <span className="font-medium text-green-600">+{formatCurrency(cashOnHandData.totalRevolvingFund)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Collections (Gross)</span>
                          <span className="font-medium text-green-600">+{formatCurrency(cashOnHandData.totalCollections)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Expenses</span>
                          <span className="font-medium text-red-600">-{formatCurrency(cashOnHandData.totalExpenses)}</span>
                      </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="flex justify-between items-center text-lg font-bold pt-2">
                        <span>Net Cash on Hand</span>
                        <span className={cashOnHandData.cashOnHand >= 0 ? 'text-primary' : 'text-destructive'}>
                            {formatCurrency(cashOnHandData.cashOnHand)}
                        </span>
                    </div>
                  </div>
                )}
            </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <Card className="xl:col-span-1">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span>Profit/Margin Tracker</span>
                    </CardTitle>
                    <Select value={profitFilter} onValueChange={(value) => setProfitFilter(value as FinancialFilter)}>
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
                <div className="max-h-96 overflow-y-auto">
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
                                <div className="font-medium">#{(booking.id || '').substring(0, 7)}</div>
                            </TableCell>
                            <TableCell>{booking.clientId}</TableCell>
                            <TableCell>{format(parseISO(booking.dueDate), 'PP')}</TableCell>
                            <TableCell className="text-right font-medium">
                                <span className={booking.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(booking.profit)}
                                </span>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No delivered bookings to analyze for this period.</p>}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        <span>Expense Tracker</span>
                    </CardTitle>
                    <Select value={expenseFilter} onValueChange={(value) => setExpenseFilter(value as FinancialFilter)}>
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
                                {formatCurrency(expense.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end text-right">
                    <div>
                        <p className="text-muted-foreground">Total Expenses ({expenseFilter})</p>
                        <p className="font-bold text-xl">{formatCurrency(totalExpenses)}</p>
                    </div>
                </div>
                </>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No expenses logged for this period.</p>}
          </CardContent>
        </Card>
        
        <Card className="xl:col-span-1">
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <LandPlot className="h-5 w-5 text-orange-500" />
                        <span>Tax Summary</span>
                    </CardTitle>
                    <Select value={taxFilter} onValueChange={(value) => setTaxFilter(value as FinancialFilter)}>
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
                {isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Output VAT (from Sales)</span>
                          <span className="font-medium">{formatCurrency(taxSummaryData.outputVat)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Input VAT (from Expenses)</span>
                          <span className="font-medium text-green-600">-{formatCurrency(taxSummaryData.inputVat)}</span>
                      </div>
                      <Separator />
                       <div className="flex justify-between items-center font-bold">
                          <span>VAT Payable</span>
                          <span>{formatCurrency(taxSummaryData.vatPayable)}</span>
                      </div>
                       <Separator />
                       <div className="flex justify-between items-center pt-2">
                          <span className="text-muted-foreground">Percentage Tax (Non-VAT)</span>
                          <span className="font-medium">{formatCurrency(taxSummaryData.percentageTax)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Income Tax</span>
                          <span className="font-medium">{formatCurrency(taxSummaryData.incomeTax)}</span>
                      </div>
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
      
      <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Truck className="h-5 w-5 text-cyan-500" />
                        <span>Profitability by Vehicle Type</span>
                    </CardTitle>
                    <Select value={vehicleProfitFilter} onValueChange={(value) => setVehicleProfitFilter(value as FinancialFilter)}>
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
                {isLoading ? <Skeleton className="h-60 w-full" /> : vehicleProfitabilityData.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Vehicle Type</TableHead>
                            <TableHead className="text-center">Bookings</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                            <TableHead className="text-right">Total Costs</TableHead>
                            <TableHead className="text-right">Net Profit</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {vehicleProfitabilityData.map(item => (
                            <TableRow key={item.vehicleType}>
                                <TableCell>
                                    <div className="font-medium">{item.vehicleType}</div>
                                </TableCell>
                                <TableCell className="text-center">{item.totalBookings}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.totalCosts)}</TableCell>
                                <TableCell className="text-right font-medium">
                                    <span className={item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(item.netProfit)}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No vehicle data to analyze for this period.</p>}
          </CardContent>
        </Card>
    </div>
  );
}

    

    

    