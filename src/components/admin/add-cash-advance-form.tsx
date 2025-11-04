
"use client";

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, CashAdvance, OwnerName } from '@/lib/types';

const owners: OwnerName[] = ["Manel", "Meann", "Egay", "Nalyn", "Mae", "Florly"];

const cashAdvanceSchema = z.object({
  driverId: z.string().min(1, 'Driver is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  date: z.date({
    required_error: 'A date is required.',
  }),
  paidBy: z.enum(['PTS', 'Credit'], { required_error: "Payment method is required." }),
  creditedTo: z.enum(owners).nullable(),
}).refine(data => {
    if (data.paidBy === 'Credit') {
        return !!data.creditedTo;
    }
    return true;
}, {
    message: "Please select who to credit when payment method is 'Credit'.",
    path: ["creditedTo"],
});


type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>;

type AddCashAdvanceFormProps = {
    drivers: User[];
    onSave: (data: Omit<CashAdvance, 'id' | 'addedBy'>) => Promise<void>;
}

export function AddCashAdvanceForm({ drivers, onSave }: AddCashAdvanceFormProps) {
  const { toast } = useToast();

  const form = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
    defaultValues: {
      driverId: undefined,
      amount: 0,
      date: new Date(),
      paidBy: 'PTS',
      creditedTo: null,
    },
  });

  const watchedPaidBy = useWatch({
    control: form.control,
    name: 'paidBy',
  });

  const onSubmit = async (data: CashAdvanceFormValues) => {
    const dataToSave = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        creditedTo: data.paidBy === 'Credit' ? data.creditedTo : null
    };
    await onSave(dataToSave);
    form.reset({
        driverId: undefined,
        amount: 0,
        date: new Date(),
        paidBy: 'PTS',
        creditedTo: null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Cash Advance</CardTitle>
        <CardDescription>Record a new cash advance for a driver.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                      <SelectTrigger>
                      <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      <SelectItem value="PTS">Paid by PTS</SelectItem>
                      <SelectItem value="Credit">Paid by Credit (for Reimbursement)</SelectItem>
                  </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {watchedPaidBy === 'Credit' && (
              <FormField
                  control={form.control}
                  name="creditedTo"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Credit To (Owner)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select an owner" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {owners.map(owner => (
                              <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                          ))}
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Advance'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
