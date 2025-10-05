
"use client";

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { Booking, User } from '@/lib/types';
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

export default function PayrollPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');

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

    const payrollByDriver = drivers.map((driver) => {
      const driverBookings = deliveredBookings.filter(
        (b) => b.driverId === driver.id
      );

      if (driverBookings.length === 0) {
        return null;
      }

      const totalPay = driverBookings.reduce(
        (sum, b) => sum + b.driverRate,
        0
      );

      return {
        driver,
        bookings: driverBookings,
        totalPay,
      };
    }).filter(Boolean) as { driver: User, bookings: Booking[], totalPay: number }[];

    return payrollByDriver;
  }, [bookings, drivers, weekStart, weekEnd]);
  
  const isLoading = isLoadingBookings || isLoadingUsers;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Payroll</h1>
          <p className="text-muted-foreground">
            Calculate and view driver payrolls on a weekly basis.
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

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="h-64 bg-muted rounded-lg animate-pulse" />
           <div className="h-64 bg-muted rounded-lg animate-pulse" />
           <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      ) : weeklyPayrollData.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklyPayrollData.map((data) => (
            <DriverPayrollCard
              key={data.driver.id}
              driver={data.driver}
              bookings={data.bookings}
              totalPay={data.totalPay}
              weekStart={weekStart}
              weekEnd={weekEnd}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Completed Bookings</h2>
          <p className="text-muted-foreground mt-2">
            There are no delivered bookings for the selected week.
          </p>
        </div>
      )}
    </div>
  );
}

