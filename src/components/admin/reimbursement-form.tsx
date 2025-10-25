
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import type { OwnerName } from "@/lib/types";

const expenseCategories = ["fuel", "maintenance", "toll", "office", "staff", "permits", "vehicle parts", "pms", "change oil", "client representation", "driver rate", "miscellaneous", "Vehicle Related Expense", "driver payroll"] as const;
const owners: OwnerName[] = ["Manel", "Meann", "Egay", "Nalyn", "Mae"];

const reimbursementSchema = z.object({
  category: z.enum(expenseCategories, { required_error: "Category is required." }),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  dateIncurred: z.date({
    required_error: "A date is required.",
  }),
  creditedTo: z.enum(owners, { required_error: "Credited owner is required." }),
  notes: z.string().optional().nullable(),
});

type ReimbursementFormValues = z.infer<typeof reimbursementSchema>;

type ReimbursementFormProps = {
    onSubmit: (data: ReimbursementFormValues) => void;
    defaultValues: Partial<ReimbursementFormValues>;
    isSubmitting: boolean;
};

export function ReimbursementForm({ onSubmit, defaultValues, isSubmitting }: ReimbursementFormProps) {
  const form = useForm<ReimbursementFormValues>({
    resolver: zodResolver(reimbursementSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select an expense category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {expenseCategories.map(cat => (
                            <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
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
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                <Input placeholder="e.g., Replacement tires for Truck A" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="dateIncurred"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Date Incurred</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value ? (
                            format(field.value, "PPP")
                            ) : (
                            <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                        }
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
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
        </div>
        
        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                <Textarea placeholder="Any additional notes about this expense..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
