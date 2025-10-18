
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RevolvingFundContribution } from '@/lib/types';


const contributionSchema = z.object({
  contributorName: z.string().min(1, 'Contributor name is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  contributionDate: z.date({
    required_error: 'A contribution date is required.',
  }),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

type RevolvingFundDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<RevolvingFundContribution, 'id' | 'addedBy'>, id?: string) => Promise<void>;
  contribution: RevolvingFundContribution | null;
};

export function RevolvingFundDialog({ isOpen, onOpenChange, onSave, contribution }: RevolvingFundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!contribution;

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && contribution) {
        form.reset({
          contributorName: contribution.contributorName,
          amount: contribution.amount,
          contributionDate: contribution.contributionDate ? parseISO(contribution.contributionDate) : new Date(),
        });
      } else {
        form.reset({
            contributorName: '',
            amount: 0,
            contributionDate: new Date(),
        });
      }
    }
  }, [isOpen, isEditMode, contribution, form]);

  const handleSubmit = async (data: ContributionFormValues) => {
    setIsSubmitting(true);
    await onSave(data, contribution?.id);
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Contribution' : 'Add New Contribution'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of the fund contribution." : 'Fill in the details to record a new contribution.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <FormField
                  control={form.control}
                  name="contributorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contributor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Owner 1" {...field} />
                      </FormControl>
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
                  name="contributionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Contribution Date</FormLabel>
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
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
