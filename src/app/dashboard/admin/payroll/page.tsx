
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Booking, User, CashAdvance, OwnerName, Reimbursement } from '@/lib/types';
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
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { CashAdvanceDialog } from '@/components/admin/cash-advance-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function PayrollPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
  const { data: cashAdvances, isLoading: isLoadingCashAdvances } = useCollection<CashAdvance>('cashAdvances');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCashAdvance, setEditingCashAdvance] = useState<CashAdvance | null>(null);
  const [deletingCashAdvance, setDeletingCashAdvance] = useState<CashAdvance | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);


  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const drivers = useMemo(() => {
    return (users || []).filter((user) => user.role === 'Driver');
  }, [users]);

  const handleAddNewCashAdvance = async (data: Omit<CashAdvance, 'id' | 'addedBy'>) => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "Not authenticated." });
        return;
    }
    
    if (data.paidBy === 'Credit') {
        if (!data.creditedTo) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please select the owner to be credited." });
            return;
        }

        const reimbursementData: Omit<Reimbursement, 'id' | 'liquidatedAt' | 'liquidatedBy'> = {
            driverId: data.driverId,
            category: 'cash advance',
            description: `Cash Advance for driver`,
            amount: data.amount,
            dateIncurred: data.date,
            creditedTo: data.creditedTo,
            status: 'Pending',
            addedBy: user.id,
            notes: `Cash Advance via Credit for Driver ID: ${data.driverId}`,
        };
        
        await addDoc(collection(firestore, "reimbursements"), reimbursementData);
        toast({ title: "Reimbursement Request Created", description: "The cash advance has been sent for liquidation." });
    } else { // PTS
        await addDoc(collection(firestore, 'cashAdvances'), {
            ...data,
            addedBy: user.id,
        });
        toast({ title: "Cash Advance Added", description: "The cash advance has been logged." });
    }
  };

  const handleEditCashAdvance = (ca: CashAdvance) => {
    setEditingCashAdvance(ca);
    setIsDialogOpen(true);
  };
  
  const handleSaveCashAdvance = async (data: Omit<CashAdvance, 'id' | 'addedBy'>, id?: string) => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Error", description: "Not authenticated." });
      return;
    }

    const dataToSave = {
      ...data,
      date: format(new Date(data.date), "yyyy-MM-dd"),
    };
    
    if (id) {
        const docRef = doc(firestore, 'cashAdvances', id);
        await updateDoc(docRef, dataToSave);
        toast({ title: "Cash Advance Updated", description: "The cash advance has been updated." });
    }
    
    setIsDialogOpen(false);
  };

  const handleOpenDeleteDialog = (ca: CashAdvance) => {
    setDeletingCashAdvance(ca);
    setIsAlertOpen(true);
  };

  const handleDeleteCashAdvance = async () => {
    if (!deletingCashAdvance || !firestore) return;

    try {
      await deleteDoc(doc(firestore, "cashAdvances", deletingCashAdvance.id));
      toast({
        title: "Cash Advance Deleted",
        description: "The cash advance has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Cash Advance",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsAlertOpen(false);
      setDeletingCashAdvance(null);
    }
  };


  const weeklyPayrollData = useMemo(() => {
    const deliveredBookings = (bookings || []).filter(
      (b) =>
        b.status === 'Delivered' &&
        b.bookingDate &&
        isWithinInterval(parseISO(b.bookingDate), {
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
    <>
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
          <AddCashAdvanceForm drivers={drivers} onSave={handleAddNewCashAdvance} />
          <Card>
            <CardHeader>
                <CardTitle>Cash Advance History</CardTitle>
            </CardHeader>
            <CardContent>
                <CashAdvanceTable 
                    data={cashAdvances || []} 
                    users={users || []} 
                    isLoading={isLoadingCashAdvances || isLoadingUsers}
                    onEdit={handleEditCashAdvance}
                    onDelete={handleOpenDeleteDialog}
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
    <CashAdvanceDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveCashAdvance}
        cashAdvance={editingCashAdvance}
        drivers={drivers}
    />
     <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the cash advance for <span className="font-bold">{users.find(u => u.id === deletingCashAdvance?.driverId)?.name}</span> amounting to <span className="font-bold">{deletingCashAdvance?.amount}</span>.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCashAdvance} className="bg-destructive hover:bg-destructive/90">
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
