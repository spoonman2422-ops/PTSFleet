
"use client";

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Booking, User, Vehicle } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Separator } from '../ui/separator';

const bookingSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  bookingDate: z.string().min(1, "Booking date is required"),
  collectionDate: z.string().min(1, "Collection date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  driverId: z.string().nullable(),
  bookingRate: z.coerce.number().min(0, 'Booking rate must be a positive number'),
  driverRate: z.coerce.number().min(0, 'Driver rate must be a positive number'),
  expectedExpenses: z.object({
    tollFee: z.coerce.number().min(0, 'Toll fee must be a positive number'),
    fuel: z.coerce.number().min(0, 'Fuel must be a positive number'),
    others: z.coerce.number().min(0, 'Other expenses must be a positive number'),
  }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type BookingDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Booking, 'id' | 'status'>, id?: string) => void;
  booking: Booking | null;
  drivers: User[];
  vehicles: Vehicle[]; // Keep this for future use if needed
};

export function BookingDialog({
  isOpen,
  onOpenChange,
  onSave,
  booking,
  drivers,
  vehicles,
}: BookingDialogProps) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientId: '',
      pickupLocation: '',
      dropoffLocation: '',
      bookingDate: '',
      collectionDate: '',
      dueDate: '',
      driverId: null,
      bookingRate: 0,
      driverRate: 0,
      expectedExpenses: {
        tollFee: 0,
        fuel: 0,
        others: 0,
      },
    },
  });
  
  const watchedValues = useWatch({ control: form.control });

  const netMargin =
    (Number(watchedValues.bookingRate) || 0) -
    ((Number(watchedValues.driverRate) || 0) +
     (Number(watchedValues.expectedExpenses?.tollFee) || 0) +
     (Number(watchedValues.expectedExpenses?.fuel) || 0) +
     (Number(watchedValues.expectedExpenses?.others) || 0));

  useEffect(() => {
    const defaultVals = {
      clientId: '',
      pickupLocation: '',
      dropoffLocation: '',
      bookingDate: '',
      collectionDate: '',
      dueDate: '',
      driverId: null,
      bookingRate: 0,
      driverRate: 0,
      expectedExpenses: {
        tollFee: 0,
        fuel: 0,
        others: 0,
      },
    };

    if (booking) {
      form.reset({
        ...defaultVals,
        ...booking,
        bookingDate: booking.bookingDate ? format(parseISO(booking.bookingDate), "yyyy-MM-dd") : '',
        collectionDate: booking.collectionDate ? format(parseISO(booking.collectionDate), "yyyy-MM-dd") : '',
        dueDate: booking.dueDate ? format(parseISO(booking.dueDate), "yyyy-MM-dd") : '',
      });
    } else {
      form.reset(defaultVals);
    }
  }, [booking, form, isOpen]);

  const onSubmit = (data: BookingFormValues) => {
    // onSave handles the conversion to number, here we just pass it on.
    onSave(data as Omit<Booking, 'id' | 'status'>, booking?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'Create New Booking'}</DialogTitle>
          <DialogDescription>
            Fill in the details below to {booking ? 'update the' : 'create a new'} booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID / Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., C001 or Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Anytown USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dropoff Location</FormLabel>
                      <FormControl>
                        <Input placeholder="456 Oak Ave, Othertown USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="bookingDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Booking Date</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="collectionDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Collection Date</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Invoice Due Date</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Driver</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-2">
                <h3 className="text-md font-semibold">Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bookingRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Rate (Client)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 12000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="driverRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Rate</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 6000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-md font-semibold">Expected Expenses</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="expectedExpenses.tollFee"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Toll Fee</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 500" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="expectedExpenses.fuel"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fuel</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 2000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="expectedExpenses.others"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Others</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
              </div>
            </div>

            <Separator />
            
            <div className="flex justify-between items-center pt-2">
                <div className="text-lg">
                    <span>Net Margin: </span>
                    <span className={`font-bold ${netMargin < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {netMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                </div>
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button type="submit">Save Booking</Button>
                </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
