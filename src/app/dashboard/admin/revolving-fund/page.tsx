
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection } from '@/firebase';
import { useUser } from '@/context/user-context';
import { addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RevolvingFundTable } from '@/components/admin/revolving-fund-table';
import type { RevolvingFundContribution, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const contributionSchema = z.object({
  contributorName: z.string().min(1, 'Contributor name is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  contributionDate: z.date({
    required_error: 'A contribution date is required.',
  }),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function RevolvingFundPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: contributions, isLoading: isLoadingContributions } = useCollection<RevolvingFundContribution>('revolvingFundContributions');
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contributorName: '',
      amount: 0,
      contributionDate: new Date(),
    },
  });

  const onSubmit = async (data: ContributionFormValues) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to perform this action.',
      });
      return;
    }

    try {
      await addDoc(collection(firestore, 'revolvingFundContributions'), {
        ...data,
        contributionDate: format(data.contributionDate, 'yyyy-MM-dd'),
        addedBy: user.id,
      });
      toast({
        title: 'Contribution Added',
        description: `Contribution from ${data.contributorName} has been successfully logged.`,
      });
      form.reset({
          contributorName: '',
          amount: 0,
          contributionDate: new Date()
      });
    } catch (error) {
      console.error('Error adding contribution: ', error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Could not save the contribution. Please try again.',
      });
    }
  };
  
  const totalRevolvingFund = useMemo(() => {
    if (!contributions) return 0;
    return contributions.reduce((total, contribution) => total + contribution.amount, 0);
  }, [contributions]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Contribution</CardTitle>
            <CardDescription>Log a new contribution to the revolving fund.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                 <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Contribution'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
         <Card>
            <CardHeader>
                <CardTitle>Contribution History</CardTitle>
                <CardDescription>A log of all contributions to the fund.</CardDescription>
            </CardHeader>
            <CardContent>
                <RevolvingFundTable
                    data={contributions || []}
                    users={users || []}
                    isLoading={isLoadingContributions || isLoadingUsers}
                />
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <Separator />
                <div className="flex justify-between w-full pt-4">
                    <p className="text-lg font-semibold">Total Revolving Fund</p>
                    <p className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalRevolvingFund)}
                    </p>
                </div>
            </CardFooter>
         </Card>
      </div>
    </div>
  );
}
