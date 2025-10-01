"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  deliveryTime: z.string().min(1, 'Delivery time is required'),
  driverId: z.string().nullable(),
  vehicleId: z.string().nullable(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type BookingDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BookingFormValues, id?: string) => void;
  booking: Booking | null;
  drivers: User[];
  vehicles: Vehicle[];
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
        customerName: '',
        pickupAddress: '',
        deliveryAddress: '',
        pickupTime: '',
        deliveryTime: '',
        driverId: null,
        vehicleId: null,
    },
  });

  useEffect(() => {
    if (booking) {
      form.reset({
        ...booking,
        pickupTime: booking.pickupTime ? format(parseISO(booking.pickupTime), "yyyy-MM-dd'T'HH:mm") : '',
        deliveryTime: booking.deliveryTime ? format(parseISO(booking.deliveryTime), "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else {
      form.reset({
        customerName: '',
        pickupAddress: '',
        deliveryAddress: '',
        pickupTime: '',
        deliveryTime: '',
        driverId: null,
        vehicleId: null,
      });
    }
  }, [booking, form]);

  const onSubmit = (data: BookingFormValues) => {
    onSave(data, booking?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'Create New Booking'}</DialogTitle>
          <DialogDescription>
            Fill in the details below to {booking ? 'update the' : 'create a new'} booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pickupAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl>
                    <Input placeholder="456 Oak Ave, Othertown USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Delivery Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
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
                <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Assign Vehicle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a vehicle" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {vehicles.map(vehicle => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>{`${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Booking</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
