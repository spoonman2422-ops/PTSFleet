
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
import type { Booking, User, Vehicle, VehicleType } from '@/lib/types';
import { format, parseISO, addDays } from 'date-fns';
import { Separator } from '../ui/separator';

const bookingSchema = z.object({
  id: z.string().min(1, 'Booking ID is required.'),
  clientId: z.string().min(1, 'Client ID is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  bookingDate: z.string().min(1, "Booking date is required"),
  collectionDate: z.string().min(1, "Collection date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  driverId: z.string().nullable(),
  vehicleType: z.enum(['6-Wheel', 'AUV']),
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
  onSave: (data: Omit<Booking, 'status' | 'id'>, id: string) => void;
  booking: Booking | null;
  drivers: User[];
  vehicles: Vehicle[];
};

const UNASSIGNED_VALUE = "unassigned";

export function BookingDialog({
  isOpen,
  onOpenChange,
  onSave,
  booking,
  drivers,
  vehicles,
}: BookingDialogProps) {
  const isEditMode = !!booking;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      id: '',
      clientId: '',
      pickupLocation: '',
      dropoffLocation: '',
      bookingDate: '',
      collectionDate: '',
      dueDate: '',
      driverId: null,
      vehicleType: '6-Wheel',
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
  const watchedBookingDate = useWatch({ control: form.control, name: 'bookingDate' });

  useEffect(() => {
    // Only auto-populate if it's a new booking and the booking date changes
    if (!isEditMode && watchedBookingDate) {
        try {
            const date = parseISO(watchedBookingDate);
            const futureDate = addDays(date, 14);
            const formattedFutureDate = format(futureDate, "yyyy-MM-dd");
            
            // To avoid overriding user's manual changes, we could check if they are empty
            // but for this logic, we'll just set it. The user can change it.
            form.setValue('collectionDate', formattedFutureDate, { shouldValidate: true });
            form.setValue('dueDate', formattedFutureDate, { shouldValidate: true });

        } catch (error) {
            // Invalid date string, do nothing
        }
    }
  }, [watchedBookingDate, isEditMode, form]);


  const netMargin =
    (Number(watchedValues.bookingRate) || 0) -
    ((Number(watchedValues.driverRate) || 0) +
     (Number(watchedValues.expectedExpenses?.tollFee) || 0) +
     (Number(watchedValues.expectedExpenses?.fuel) || 0) +
     (Number(watchedValues.expectedExpenses?.others) || 0));

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        form.reset({
          ...booking,
          id: booking.id || '',
          bookingDate: booking.bookingDate ? format(parseISO(booking.bookingDate), "yyyy-MM-dd") : '',
          collectionDate: booking.collectionDate ? format(parseISO(booking.collectionDate), "yyyy-MM-dd") : '',
          dueDate: booking.dueDate ? format(parseISO(booking.dueDate), "yyyy-MM-dd") : '',
          driverId: booking.driverId || null,
        });
      } else {
        form.reset({
          id: '',
          clientId: '',
          pickupLocation: '',
          dropoffLocation: '',
          bookingDate: '',
          collectionDate: '',
          dueDate: '',
          driverId: null,
          vehicleType: '6-Wheel',
          bookingRate: 0,
          driverRate: 0,
          expectedExpenses: {
            tollFee: 0,
            fuel: 0,
            others: 0,
          },
        });
      }
    }
  }, [booking, form, isOpen]);

  const onSubmit = (data: BookingFormValues) => {
    const submissionId = data.id!; 
    const dataToSave = {
      ...data,
      driverId: data.driverId === UNASSIGNED_VALUE ? null : data.driverId,
    };
    const { id, ...rest } = dataToSave;
    onSave(rest, submissionId);
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
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a unique booking ID" {...field} readOnly={isEditMode}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Driver</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === UNASSIGNED_VALUE ? null : value)} 
                          value={field.value ?? UNASSIGNED_VALUE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a driver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                            {drivers.map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6-Wheel">6-Wheel</SelectItem>
                              <SelectItem value="AUV">AUV</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
              </div>

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
                          <Input type="number" placeholder="0.00" {...field} />
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
                          <Input type="number" placeholder="0.00" {...field} />
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
                            <Input type="number" placeholder="0.00" {...field} />
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
                            <Input type="number" placeholder="0.00" {...field} />
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
                            <Input type="number" placeholder="0.00" {...field} />
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
                        {netMargin.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
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
