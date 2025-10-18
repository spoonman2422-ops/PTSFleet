
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection } from '@/firebase';
import { useUser } from '@/context/user-context';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
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
import { RevolvingFundDialog } from '@/components/admin/revolving-fund-dialog';


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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<RevolvingFundContribution | null>(null);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contributorName: '',
      amount: 0,
      contributionDate: new Date(),
    },
  });

  const handleAddNew = () => {
    setEditingContribution(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (contribution: RevolvingFundContribution) => {
    setEditingContribution(contribution);
    setIsDialogOpen(true);
  };

  const handleSaveContribution = async (data: Omit<RevolvingFundContribution, 'id'|'addedBy'>, id?: string) => {
     if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated.' });
      return;
    }

    const dataToSave = {
        ...data,
        contributionDate: format(new Date(data.contributionDate), 'yyyy-MM-dd'),
    };

    if (id) {
        // Update
        const docRef = doc(firestore, 'revolvingFundContributions', id);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Contribution Updated', description: `Contribution from ${data.contributorName} has been updated.` });
    } else {
        // Create
        await addDoc(collection(firestore, 'revolvingFundContributions'), {
            ...dataToSave,
            addedBy: user.id
        });
        toast({ title: 'Contribution Added', description: `Contribution from ${data.contributorName} has been logged.` });
    }
    setIsDialogOpen(false);
  };
  
  const totalRevolvingFund = useMemo(() => {
    if (!contributions) return 0;
    return contributions.reduce((total, contribution) => total + contribution.amount, 0);
  }, [contributions]);

  const isLoading = isLoadingContributions || isLoadingUsers;

  return (
    <>
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revolving Fund</CardTitle>
            <CardDescription>Log a new contribution or view the total fund.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddNew} className="w-full">Add New Contribution</Button>
          </CardContent>
           <CardFooter className="flex-col items-start gap-2">
                <Separator />
                <div className="flex justify-between w-full pt-4">
                    <p className="text-lg font-semibold">Total Fund</p>
                    <p className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalRevolvingFund)}
                    </p>
                </div>
            </CardFooter>
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
                    isLoading={isLoading}
                    onEdit={handleEdit}
                />
            </CardContent>
         </Card>
      </div>
    </div>
    <RevolvingFundDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveContribution}
        contribution={editingContribution}
    />
    </>
  );
}
