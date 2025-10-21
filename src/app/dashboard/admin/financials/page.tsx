
"use client";

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, Invoice, Expense, RevolvingFundContribution, User, Vehicle, VehicleType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, isAfter, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { TrendingUp, AlertTriangle, CalendarCheck2, Briefcase, Wallet, CheckCircle, LandPlot, HandCoins, Truck, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { vehicles } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { FinancialReportDialog, ReportData } from '@/components/admin/financial-report-dialog';
import { CollectionsChart } from '@/components/admin/collections-chart';
import { ProfitChart } from '@/components/admin/profit-chart';


type FinancialFilter = 'Overall' | 'Annual' | 'Monthly' | 'Weekly';
type ReportType = 'upcoming' | 'outstanding' | 'completed' | 'cash' | 'profit' | 'expense' | 'vehicle';

export default function FinancialsPage() {
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>('expenses');
  const { data: contributions, isLoading: isLoadingContributions } = useCollection<RevolvingFundContribution>('revolvingFundContributions');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [profitFilter, setProfitFilter] = useState<FinancialFilter>('Overall');
  const [expenseFilter, setExpenseFilter] = useState<FinancialFilter>('Overall');
  const [taxFilter, setTaxFilter] = useState<FinancialFilter>('Overall');
  const [cashOnHandFilter, setCashOnHandFilter] = useState<FinancialFilter>('Overall');
  const [vehicleProfitFilter, setVehicleProfitFilter] = useState<FinancialFilter>('Overall');
  const [completedFilter, setCompletedFilter] = useState<FinancialFilter>('Overall');


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


  const upcomingBillings = useMemo(() => {
    if (!bookings || !invoices) return { data: [], totalAmount: 0, totalCount: 0 };
    const data = bookings
      .filter(b => {
        const invoice = invoices.find(inv => inv.bookingId === b.id);
        if (invoice && invoice.status === 'Paid') {
          return false;
        }
        return b.billingDate && isAfter(parseISO(b.billingDate), now) && isBefore(parseISO(b.billingDate), nextSevenDays)
      })
      .sort((a, b) => parseISO(a.billingDate).getTime() - parseISO(b.billingDate).getTime());
    
    const totalAmount = data.reduce((sum, b) => sum + b.bookingRate, 0);
    const totalCount = data.length;

    return { data, totalAmount, totalCount };
  }, [bookings, invoices, now, nextSevenDays]);
  
  const completedCollections = useMemo(() => {
    if (!invoices || !bookings) return { data: [], reportData: [], totalAmount: 0, totalCount: 0, chartData: [] };
    const startDate = getStartDate(completedFilter);

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid' && inv.dateIssued && isAfter(parseISO(inv.dateIssued), startDate));
    
    const totalAmount = paidInvoices.reduce((sum, inv) => sum + inv.grossSales, 0);
    const totalCount = paidInvoices.length;

    const reportData = paidInvoices
      .map(inv => {
        const booking = bookings.find(b => b.id === inv.bookingId);
        return { invoice: inv, booking };
      })
      .sort((a, b) => {
         const dateA = a.invoice.dateIssued ? parseISO(a.invoice.dateIssued).getTime() : 0;
         const dateB = b.invoice.dateIssued ? parseISO(b.invoice.dateIssued).getTime() : 0;
         return dateB - dateA;
      });

    const collectionsByClient = paidInvoices.reduce((acc, inv) => {
        const clientName = inv.clientId;
        if (!acc[clientName]) {
            acc[clientName] = 0;
        }
        acc[clientName] += inv.grossSales;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(collectionsByClient)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    
    return { reportData, totalAmount, totalCount, chartData };
  }, [invoices, bookings, completedFilter]);


  const outstandingPayments = useMemo(() => {
    if (!invoices || !bookings) return { data: [], totalAmount: 0, totalCount: 0 };
    const data = invoices
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
      
    const totalAmount = data.reduce((sum, { invoice }) => sum + invoice.grossSales, 0);
    const totalCount = data.length;

    return { data, totalAmount, totalCount };
  }, [invoices, bookings, now]);


  const profitTrackerData = useMemo(() => {
    if (!bookings) return { data: [], totalProfit: 0, chartData: [] };
    
    const startDate = getStartDate(profitFilter);

    const deliveredBookings = bookings
        .filter(b => b.status === 'Delivered' && b.completionDate && isAfter(parseISO(b.completionDate), startDate));

    const dataForReport = deliveredBookings
      .map(booking => {
        const costs = (booking.driverRate || 0) + (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
        const profit = booking.bookingRate - costs;
        return { ...booking, profit, costs };
      })
      .sort((a, b) => {
        const dateA = a.completionDate ? parseISO(a.completionDate).getTime() : 0;
        const dateB = b.completionDate ? parseISO(b.completionDate).getTime() : 0;
        return dateB - dateA;
      });

    const profitByClient = deliveredBookings.reduce((acc, booking) => {
      const clientName = booking.clientId;
      if (!clientName) return acc;
      if (!acc[clientName]) {
        acc[clientName] = 0;
      }
      const costs = (booking.driverRate || 0) + (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
      const profit = booking.bookingRate - costs;
      acc[clientName] += profit;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(profitByClient)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    
    const totalProfit = chartData.reduce((sum, item) => sum + item.total, 0);

    return { data: dataForReport, totalProfit, chartData, bookingCount: deliveredBookings.length };
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
    if (!invoices || !expenses || !contributions) {
        return { totalCollections: 0, totalExpenses: 0, totalRevolvingFund: 0, cashOnHand: 0 };
    }
    const startDate = getStartDate(cashOnHandFilter);

    const paidInvoices = (invoices || [])
        .filter(inv => inv.status === 'Paid' && inv.dateIssued && isAfter(parseISO(inv.dateIssued), startDate));

    const totalCollections = paidInvoices.reduce((sum, inv) => sum + inv.grossSales, 0);

    const totalExpensesFromLog = (expenses || [])
        .filter(exp => exp.dateIncurred && isAfter(parseISO(exp.dateIncurred), startDate))
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalRevolvingFund = (contributions || [])
        .filter(c => c.contributionDate && isAfter(parseISO(c.contributionDate), startDate))
        .reduce((sum, c) => sum + c.amount, 0);
    
    const cashOnHand = totalCollections + totalRevolvingFund - totalExpensesFromLog;

    return { 
        totalRevolvingFund, 
        totalCollections, 
        totalExpenses: totalExpensesFromLog, 
        cashOnHand,
        paidInvoices, // For report
        expenses: totalExpensesFromLog, // For report
        contributions: totalRevolvingFund // For report
    };
}, [invoices, expenses, contributions, cashOnHandFilter]);

  const vehicleProfitabilityData = useMemo(() => {
    if (!bookings) return { data: [], totalProfit: 0 };

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
    
    const data = Object.values(profitByVehicleType).sort((a, b) => b.netProfit - a.netProfit);
    const totalProfit = data.reduce((sum, item) => sum + item.netProfit, 0);

    return { data, totalProfit };
}, [bookings, vehicleProfitFilter]);

  const handleViewReport = (type: ReportType) => {
    let data: ReportData = { title: '', headers: [], rows: [] };
    
    switch (type) {
        case 'upcoming':
            data = {
                title: "Upcoming Billings Report",
                headers: ["Booking ID", "Client", "Billing Date", "Amount"],
                rows: upcomingBillings.data.map(b => [
                    `#${(b.id || '').substring(0,7).toUpperCase()}`,
                    b.clientId,
                    format(parseISO(b.billingDate), 'PP'),
                    formatCurrency(b.bookingRate)
                ]),
                total: upcomingBillings.totalAmount
            };
            break;
        case 'outstanding':
            data = {
                title: "Outstanding Payments Report",
                headers: ["Booking ID", "Client", "Due Date", "Days Overdue", "Amount"],
                rows: outstandingPayments.data.map(({invoice: i, booking: b}) => [
                    `#${(b?.id || i.bookingId).substring(0,7).toUpperCase()}`,
                    b?.clientId || i.clientId,
                    format(parseISO(i.dueDate), 'PP'),
                    `${differenceInDays(now, parseISO(i.dueDate))} days`,
                    formatCurrency(i.grossSales)
                ]),
                total: outstandingPayments.totalAmount
            };
            break;
         case 'completed':
            data = {
                title: "Completed Collections Report",
                headers: ["Booking ID", "Client", "Paid Date", "Amount"],
                rows: completedCollections.reportData.map(({ invoice: i, booking: b }) => [
                    `#${(b?.id || '').substring(0,7).toUpperCase()}`,
                    i.clientId,
                    i.dateIssued ? format(parseISO(i.dateIssued), 'PP') : 'N/A',
                    formatCurrency(i.grossSales)
                ]),
                total: completedCollections.totalAmount
            };
            break;
        case 'cash':
            data = {
                title: `Cash on Hand Report (${cashOnHandFilter})`,
                headers: ["Date", "Description", "Type", "Amount"],
                rows: [
                    ...(cashOnHandData.paidInvoices || []).map(i => [format(parseISO(i.dateIssued), 'PP'), `Collection for Inv #${i.id.substring(0,7)}`, 'Collection', formatCurrency(i.grossSales)]),
                    ...filteredExpenses.map(e => [format(parseISO(e.dateIncurred), 'PP'), e.description, 'Expense', `-${formatCurrency(e.amount)}`]),
                    ...(contributions || []).filter(c => c.contributionDate && isAfter(parseISO(c.contributionDate), getStartDate(cashOnHandFilter))).map(c => [format(parseISO(c.contributionDate), 'PP'), `Contribution from ${c.contributorName}`, 'Revolving Fund', formatCurrency(c.amount)])
                ].sort((a, b) => parseISO(b[0] as string).getTime() - parseISO(a[0] as string).getTime())
            };
            break;
        case 'profit':
             data = {
                title: `Profit/Margin Report (${profitFilter})`,
                headers: ["Booking ID", "Client", "Completion Date", "Revenue", "Costs", "Profit"],
                rows: profitTrackerData.data.map(b => [
                    `#${(b.id || '').substring(0,7).toUpperCase()}`,
                    b.clientId,
                    b.completionDate ? format(parseISO(b.completionDate), 'PP') : 'N/A',
                    formatCurrency(b.bookingRate),
                    formatCurrency(b.costs),
                    formatCurrency(b.profit)
                ]),
                footer: [
                  ['Total Revenue', profitTrackerData.data.reduce((sum, b) => sum + b.bookingRate, 0)],
                  ['Total Costs', profitTrackerData.data.reduce((sum, b) => sum + b.costs, 0)],
                  ['Total Profit', profitTrackerData.totalProfit],
                ]
            };
            break;
        case 'expense':
            data = {
                title: `Expense Report (${expenseFilter})`,
                headers: ["Date", "Category", "Description", "Amount"],
                rows: filteredExpenses.map(e => [
                    format(parseISO(e.dateIncurred), 'PP'),
                    e.category,
                    e.description,
                    formatCurrency(e.amount)
                ]),
                total: totalExpenses
            };
            break;
        case 'vehicle':
             data = {
                title: `Vehicle Profitability Report (${vehicleProfitFilter})`,
                headers: ["Vehicle Type", "Bookings", "Total Revenue", "Total Costs", "Net Profit"],
                rows: vehicleProfitabilityData.data.map(v => [
                    v.vehicleType,
                    v.totalBookings.toString(),
                    formatCurrency(v.totalRevenue),
                    formatCurrency(v.totalCosts),
                    formatCurrency(v.netProfit)
                ]),
                total: vehicleProfitabilityData.totalProfit
            };
            break;

    }
    setReportData(data);
    setIsReportOpen(true);
  };

  const isLoading = isLoadingBookings || isLoadingInvoices || isLoadingExpenses || isLoadingContributions || isLoadingUsers;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);


  return (
    <>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Monitor your collections, outstanding payments, and profitability.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck2 className="h-5 w-5 text-blue-500" />
                <span>Upcoming Billings</span>
            </CardTitle>
             <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             {isLoading ? <Skeleton className="h-20 w-full" /> : (
                <>
                <div>
                    <p className="text-2xl font-bold">{formatCurrency(upcomingBillings.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">from {upcomingBillings.totalCount} booking(s)</p>
                </div>
                {upcomingBillings.data.length > 0 ? (
                <>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {upcomingBillings.data.slice(0,2).map(booking => (
                        <TableRow key={booking.id}>
                            <TableCell>
                            <div className="font-medium">#{(booking.id || '').substring(0,7).toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{booking.clientId}</div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(booking.bookingRate)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                    <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('upcoming')}>
                        <Eye className="mr-2 h-4 w-4" /> View Full Report
                    </Button>
                </>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No upcoming billings.</p>}
                </>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Outstanding Payments</span>
            </CardTitle>
            <CardDescription>All overdue invoices</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             {isLoading ? <Skeleton className="h-20 w-full" /> : (
                <>
                <div>
                    <p className="text-2xl font-bold">{formatCurrency(outstandingPayments.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">from {outstandingPayments.totalCount} invoice(s)</p>
                </div>
                {outstandingPayments.data.length > 0 ? (
                    <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Booking</TableHead>
                                <TableHead className="text-right">Days Overdue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outstandingPayments.data.slice(0,2).map(({ invoice, booking }) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <div className="font-medium">Booking #{(booking?.id || invoice.bookingId).substring(0, 7).toUpperCase()}</div>
                                        <div className="text-xs text-muted-foreground">{booking?.clientId || invoice.clientId}</div>
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">
                                        {differenceInDays(now, parseISO(invoice.dueDate))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('outstanding')}>
                        <Eye className="mr-2 h-4 w-4" /> View Full Report
                    </Button>
                    </>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No outstanding payments. Good job!</p>}
                </>
             )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle className="h-5 w-5 text-green-500"/>
                            <span>Completed Collections</span>
                        </CardTitle>
                    </div>
                     <Select value={completedFilter} onValueChange={(value) => setCompletedFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs">
                            <SelectValue placeholder="Filter" />
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
            <CardContent className="flex flex-col gap-4">
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                    <>
                    <div>
                        <p className="text-2xl font-bold">{formatCurrency(completedCollections.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">from {completedCollections.totalCount} invoice(s)</p>
                    </div>
                    {completedCollections.chartData.length > 0 ? (
                        <div className="h-48">
                           <CollectionsChart data={completedCollections.chartData} totalAmount={completedCollections.totalAmount}/>
                        </div>
                    ) : <p className="text-sm text-muted-foreground text-center py-10">No collections for this period.</p>}
                     <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('completed')}>
                        <Eye className="mr-2 h-4 w-4" /> View Full Report
                    </Button>
                    </>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <HandCoins className="h-5 w-5 text-purple-500" />
                            <span>Cash on Hand</span>
                        </CardTitle>
                        <CardDescription>Net cash flow</CardDescription>
                    </div>
                    <Select value={cashOnHandFilter} onValueChange={(value) => setCashOnHandFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                            <SelectValue placeholder="Filter" />
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
                          <span className="text-muted-foreground">Total Collections</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="xl:col-span-1">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span>Profit/Margin Tracker</span>
                        </CardTitle>
                    </div>
                    <Select value={profitFilter} onValueChange={(value) => setProfitFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                            <SelectValue placeholder="Filter" />
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
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                  <>
                  <div>
                      <p className="text-2xl font-bold">{formatCurrency(profitTrackerData.totalProfit)}</p>
                      <p className="text-xs text-muted-foreground">from {profitTrackerData.bookingCount} delivered booking(s)</p>
                  </div>
                  {profitTrackerData.chartData.length > 0 ? (
                      <div className="h-48">
                         <ProfitChart data={profitTrackerData.chartData} totalProfit={profitTrackerData.totalProfit}/>
                      </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-10">No delivered bookings to analyze.</p>}
                   <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('profit')}>
                      <Eye className="mr-2 h-4 w-4" /> View Full Report
                  </Button>
                  </>
              )}
            </CardContent>
        </Card>

        <Card className="xl:col-span-1">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-blue-500" />
                            <span>Expense Tracker</span>
                        </CardTitle>
                    </div>
                    <Select value={expenseFilter} onValueChange={(value) => setExpenseFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                            <SelectValue placeholder="Filter" />
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
                <div className="mb-4">
                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-muted-foreground">from {filteredExpenses.length} transaction(s)</p>
                </div>
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
                    {filteredExpenses.slice(0,5).map(expense => (
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
                <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('expense')}>
                    <Eye className="mr-2 h-4 w-4" /> View Full Report
                </Button>
                </>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No expenses logged for this period.</p>}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <LandPlot className="h-5 w-5 text-orange-500" />
                            <span>Tax Summary</span>
                        </CardTitle>
                    </div>
                    <Select value={taxFilter} onValueChange={(value) => setTaxFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                            <SelectValue placeholder="Filter" />
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
      
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Truck className="h-5 w-5 text-cyan-500" />
                            <span>Profitability by Vehicle Type</span>
                        </CardTitle>
                    </div>
                    <Select value={vehicleProfitFilter} onValueChange={(value) => setVehicleProfitFilter(value as FinancialFilter)}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                            <SelectValue placeholder="Filter" />
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
                {isLoading ? <Skeleton className="h-60 w-full" /> : vehicleProfitabilityData.data.length > 0 ? (
                <>
                <div className="mb-4">
                    <p className="text-2xl font-bold">{formatCurrency(vehicleProfitabilityData.totalProfit)}</p>
                    <p className="text-xs text-muted-foreground">Total net profit across all vehicle types</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Vehicle Type</TableHead>
                            <TableHead className="text-center">Bookings</TableHead>
                            <TableHead className="text-right">Net Profit</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {vehicleProfitabilityData.data.map(item => (
                            <TableRow key={item.vehicleType}>
                                <TableCell>
                                    <div className="font-medium">{item.vehicleType}</div>
                                </TableCell>
                                <TableCell className="text-center">{item.totalBookings}</TableCell>
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
                <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleViewReport('vehicle')}>
                    <Eye className="mr-2 h-4 w-4" /> View Full Report
                </Button>
                </>
             ) : <p className="text-sm text-muted-foreground text-center py-10">No vehicle data to analyze for this period.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
     <FinancialReportDialog
        isOpen={isReportOpen}
        onOpenChange={setIsReportOpen}
        data={reportData}
      />
    </>
  );
}

    
