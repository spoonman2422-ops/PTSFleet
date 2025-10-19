
"use client";

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Invoice } from '@/lib/types';


const invoiceSchema = z.object({
  grossSales: z.coerce.number().min(0, 'Gross sales must be a positive number.'),
  dateIssued: z.string().min(1, "Issue date is required."),
  dueDate: z.string().min(1, "Due date is required."),
  status: z.enum(['Paid', 'Unpaid', 'Overdue']),
  vatRegistered: z.boolean(),
  incomeTaxOption: z.enum(['8_percent_flat', 'graduated']),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type InvoiceDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Invoice>, id: string) => Promise<void>;
  invoice: Invoice;
};

export function InvoiceDialog({ isOpen, onOpenChange, onSave, invoice }: InvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
  });

  const watchedVatRegistered = useWatch({ control: form.control, name: 'vatRegistered' });
  const watchedIncomeTaxOption = useWatch({ control: form.control, name: 'incomeTaxOption' });
  const watchedGrossSales = useWatch({ control: form.control, name: 'grossSales' });

  useEffect(() => {
    if (invoice) {
      form.reset({
        grossSales: invoice.grossSales,
        dateIssued: format(parseISO(invoice.dateIssued), 'yyyy-MM-dd'),
        dueDate: format(parseISO(invoice.dueDate), 'yyyy-MM-dd'),
        status: invoice.status,
        vatRegistered: invoice.vatRegistered,
        incomeTaxOption: invoice.incomeTaxOption,
      });
    }
  }, [invoice, form]);

  const handleSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    const grossSales = data.grossSales;
    let vatAmount = 0;
    let percentageTaxAmount = 0;
    let incomeTaxAmount = 0;

    if (data.vatRegistered) {
        vatAmount = grossSales * 0.12;
        percentageTaxAmount = 0;
    } else {
        vatAmount = 0;
        percentageTaxAmount = data.incomeTaxOption === 'graduated' ? grossSales * 0.03 : 0;
    }

    if (data.incomeTaxOption === '8_percent_flat') {
        const taxableIncome = Math.max(0, grossSales - 250000);
        incomeTaxAmount = taxableIncome * 0.08;
    } else {
        const taxableIncome = grossSales; 
        if (taxableIncome <= 250000) incomeTaxAmount = 0;
        else if (taxableIncome <= 400000) incomeTaxAmount = (taxableIncome - 250000) * 0.15;
        else if (taxableIncome <= 800000) incomeTaxAmount = 22500 + (taxableIncome - 400000) * 0.20;
        else if (taxableIncome <= 2000000) incomeTaxAmount = 102500 + (taxableIncome - 800000) * 0.25;
        else if (taxableIncome <= 8000000) incomeTaxAmount = 402500 + (taxableIncome - 2000000) * 0.30;
        else incomeTaxAmount = 2202500 + (taxableIncome - 8000000) * 0.35;
    }

    const totalTaxes = vatAmount + percentageTaxAmount + incomeTaxAmount;
    const netRevenue = grossSales - totalTaxes;

    const dataToSave: Partial<Invoice> = {
      ...data,
      vatAmount,
      percentageTaxAmount,
      incomeTaxAmount,
      netRevenue,
      dateIssued: new Date(data.dateIssued).toISOString(),
      dueDate: new Date(data.dueDate).toISOString(),
    };
    
    await onSave(dataToSave, invoice.id);
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice #{invoice.id.substring(0,7)}</DialogTitle>
          <DialogDescription>
            Update the details of the invoice. Tax values will be recalculated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                <FormField
                    control={form.control}
                    name="grossSales"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gross Sales</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dateIssued"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date Issued</FormLabel>
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
                            <FormLabel>Due Date</FormLabel>
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
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <Separator />
                <h3 className="text-md font-semibold">Tax Information</h3>
                
                <FormField
                    control={form.control}
                    name="vatRegistered"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Business is VAT Registered
                                </FormLabel>
                                <FormDescription>
                                This determines if 12% VAT or 3% Percentage Tax is applied.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="incomeTaxOption"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Income Tax Option</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select an income tax option" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="8_percent_flat">8% Flat Rate</SelectItem>
                            <SelectItem value="graduated">Graduated Income Tax</SelectItem>
                        </SelectContent>
                        </Select>
                         <FormDescription>
                           {field.value === 'graduated' && !watchedVatRegistered ? 'Note: 3% Percentage Tax will be applied with this option for non-VAT businesses.' : ''}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

