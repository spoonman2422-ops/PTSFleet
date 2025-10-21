
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import { Separator } from '../ui/separator';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required.'),
  model: z.string().min(1, 'Model is required.'),
  year: z.coerce.number().min(1980, 'Invalid year.').max(new Date().getFullYear() + 1),
  plateNumber: z.string().min(1, 'Plate number is required.'),
  vin: z.string().min(1, 'VIN is required.'),
  ownerName: z.string().min(1, "Owner's name is required."),
  dateAcquired: z.date({ required_error: 'Date acquired is required.' }),
  nextMaintenanceDate: z.date({ required_error: 'Next maintenance date is required.' }),
  amortizationSchedule: z.string().min(1, 'Amortization schedule is required.'),
  amortizationEndDate: z.date({ required_error: 'Amortization end date is required.' }),
  status: z.enum(['Active', 'Under Maintenance', 'Decommissioned'], { required_error: 'Status is required.' }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

type VehicleDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Vehicle, 'id'>, id?: string) => Promise<void>;
  vehicle: Vehicle | null;
};

export function VehicleDialog({ isOpen, onOpenChange, onSave, vehicle }: VehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!vehicle;

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && vehicle) {
        form.reset({
          ...vehicle,
          dateAcquired: parseISO(vehicle.dateAcquired),
          nextMaintenanceDate: parseISO(vehicle.nextMaintenanceDate),
          amortizationEndDate: parseISO(vehicle.amortizationEndDate),
        });
      } else {
        form.reset({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          plateNumber: '',
          vin: '',
          ownerName: '',
          dateAcquired: new Date(),
          nextMaintenanceDate: new Date(),
          amortizationSchedule: '',
          amortizationEndDate: new Date(),
          status: 'Active',
        });
      }
    }
  }, [isOpen, isEditMode, vehicle, form]);

  const handleSubmit = async (data: VehicleFormValues) => {
    setIsSubmitting(true);
    await onSave(data, vehicle?.id);
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of the vehicle." : 'Fill in the details to add a new vehicle.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="make" render={({ field }) => (
                        <FormItem><FormLabel>Make/Brand</FormLabel><FormControl><Input placeholder="e.g., Isuzu" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="model" render={({ field }) => (
                        <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., N-Series" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="year" render={({ field }) => (
                        <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="e.g., 2023" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="plateNumber" render={({ field }) => (
                        <FormItem><FormLabel>Plate Number</FormLabel><FormControl><Input placeholder="e.g., ABC-1234" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="vin" render={({ field }) => (
                        <FormItem><FormLabel>VIN</FormLabel><FormControl><Input placeholder="Vehicle Identification Number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="ownerName" render={({ field }) => (
                    <FormItem><FormLabel>Owner's Name</FormLabel><FormControl><Input placeholder="Full name of the vehicle owner" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <Separator />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="dateAcquired" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Date Acquired</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent></Popover><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="nextMaintenanceDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Next Maintenance</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent></Popover><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="amortizationSchedule" render={({ field }) => (
                        <FormItem><FormLabel>Amortization Schedule</FormLabel><FormControl><Input placeholder="e.g., Every 15th of the month" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="amortizationEndDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Amortization End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent></Popover><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
            </div>
            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save Vehicle'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
