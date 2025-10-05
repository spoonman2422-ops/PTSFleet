
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Booking, User, CashAdvance } from '@/lib/types';
import {
  startOfWeek,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DriverPayrollCard } from '@/components/admin/driver-payroll-card';
import { AddCashAdvanceForm } from '@/components/admin/add-cash-advance-form';
import { CashAdvanceTable } from '@/components/admin/cash-advance-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PayrollPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  const { data: cashAdvances, isLoading: isLoadingCashAdvances } = useCollection<CashAdvance>('cashAdvances');

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const drivers = useMemo(() => {
    return (users || []).filter((user) => user.role === 'Driver');
  }, [users]);

  const weeklyPayrollData = useMemo(() => {
    const deliveredBookings = (bookings || []).filter(
      (b) =>
        b.status === 'Delivered' &&
        b.completionDate &&
        isWithinInterval(parseISO(b.completionDate), {
          start: weekStart,
          end: weekEnd,
        })
    );
    
    const weeklyCashAdvances = (cashAdvances || []).filter(
      ca => ca.date && isWithinInterval(parseISO(ca.date), { start: weekStart, end: weekEnd })
    );

    const payrollByDriver = drivers.map((driver) => {
      const driverBookings = deliveredBookings.filter(
        (b) => b.driverId === driver.id
      );
      
      const driverCashAdvances = weeklyCashAdvances.filter(ca => ca.driverId === driver.id);
      
      const totalCashAdvance = driverCashAdvances.reduce((sum, ca) => sum + ca.amount, 0);

      if (driverBookings.length === 0 && driverCashAdvances.length === 0) {
        return null;
      }

      const totalPay = driverBookings.reduce(
        (sum, b) => sum + b.driverRate,
        0
      );

      return {
        driver,
        bookings: driverBookings,
        cashAdvances: driverCashAdvances,
        totalPay,
        totalCashAdvance,
        netPay: totalPay - totalCashAdvance,
      };
    }).filter(Boolean) as { 
        driver: User, 
        bookings: Booking[], 
        cashAdvances: CashAdvance[],
        totalPay: number, 
        totalCashAdvance: number,
        netPay: number
    }[];

    return payrollByDriver;
  }, [bookings, drivers, cashAdvances, weekStart, weekEnd]);
  
  const isLoading = isLoadingBookings || isLoadingUsers || isLoadingCashAdvances;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Payroll</h1>
          <p className="text-muted-foreground">
            Calculate weekly payrolls and manage driver cash advances.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-full sm:w-[280px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {format(weekStart, 'LLL dd, y')} - {format(weekEnd, 'LLL dd, y')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => setDate(d || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AddCashAdvanceForm drivers={drivers} />
          <Card>
            <CardHeader>
                <CardTitle>Cash Advance History</CardTitle>
            </CardHeader>
            <CardContent>
                <CashAdvanceTable 
                    data={cashAdvances || []} 
                    users={users || []} 
                    isLoading={isLoadingCashAdvances || isLoadingUsers}
                />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
                </div>
            ) : weeklyPayrollData.length > 0 ? (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {weeklyPayrollData.map((data) => (
                    <DriverPayrollCard
                        key={data.driver.id}
                        driver={data.driver}
                        bookings={data.bookings}
                        cashAdvances={data.cashAdvances}
                        totalPay={data.totalPay}
                        totalCashAdvance={data.totalCashAdvance}
                        netPay={data.netPay}
                        weekStart={weekStart}
                        weekEnd={weekEnd}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex items-center justify-center">
                    <div>
                        <h2 className="text-xl font-semibold">No Payroll Data</h2>
                        <p className="text-muted-foreground mt-2">
                            There are no delivered bookings or cash advances for the selected week.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
