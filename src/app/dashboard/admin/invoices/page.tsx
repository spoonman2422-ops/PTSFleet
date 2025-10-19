
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Invoice, User, Booking, InvoiceStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Printer, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceSheet } from '@/components/admin/invoice-sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvoiceDialog } from '@/components/admin/invoice-dialog';


const statusConfig: Record<InvoiceStatus, { variant: 'secondary' | 'default' | 'destructive', className: string }> = {
    Paid: { variant: 'default', className: 'bg-green-100 text-green-800' },
    Unpaid: { variant: 'secondary', className: 'bg-amber-100 text-amber-800' },
    Overdue: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
};

const invoiceStatuses: (InvoiceStatus | 'All')[] = ['All', 'Paid', 'Unpaid', 'Overdue'];


export default function InvoicesPage() {
    const firestore = useFirestore();
    const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>('invoices');
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');
    const { data: bookings, isLoading: isLoadingBookings } = useCollection<Booking>('bookings');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);


    const { toast } = useToast();

    const sortedInvoices = useMemo(() => {
        if (!invoices) return [];
        return invoices.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        let filtered = sortedInvoices;
        
        if (filterStatus !== 'All') {
            filtered = filtered.filter(i => i.status === filterStatus);
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(invoice => {
                 const client = users?.find(u => u.id === invoice.clientId);
                 const clientNameMatch = client?.name.toLowerCase().includes(lowercasedQuery) ?? invoice.clientId.toLowerCase().includes(lowercasedQuery);
                 const invoiceIdMatch = invoice.id.substring(0, 7).toLowerCase().includes(lowercasedQuery);
                 const bookingIdMatch = invoice.bookingId.substring(0, 7).toLowerCase().includes(lowercasedQuery);
                 return clientNameMatch || invoiceIdMatch || bookingIdMatch;
            });
        }
        return filtered;
    }, [sortedInvoices, filterStatus, searchQuery, users]);
    
    const isLoading = isLoadingInvoices || isLoadingUsers || isLoadingBookings;

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsSheetOpen(true);
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsDialogOpen(true);
    };

    const handleSaveInvoice = async (data: Partial<Invoice>, id: string) => {
        if (!firestore) return;
        
        const invoiceRef = doc(firestore, 'invoices', id);
        await updateDoc(invoiceRef, data);
        
        toast({
            title: 'Invoice Updated',
            description: `Invoice #${id.substring(0,7)} has been successfully updated.`,
        });
        setIsDialogOpen(false);
    };

    const handleUpdateStatus = async (invoiceId: string, status: InvoiceStatus) => {
        if (!firestore) return;
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        try {
            await updateDoc(invoiceRef, { status });
            toast({
                title: 'Invoice Status Updated',
                description: `Invoice #${invoiceId.substring(0,7)} has been marked as ${status}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating status',
                description: (error as Error).message,
            });
        }
    };

    const handleOpenDeleteDialog = (invoice: Invoice) => {
        setDeletingInvoice(invoice);
        setIsAlertOpen(true);
    };

    const handleDeleteInvoice = async () => {
        if (!deletingInvoice || !firestore) return;

        try {
            const invoiceRef = doc(firestore, 'invoices', deletingInvoice.id);
            await deleteDoc(invoiceRef);

            toast({
                title: 'Invoice Deleted',
                description: `Invoice #${deletingInvoice.id.substring(0, 7)} has been permanently deleted.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to delete invoice',
                description: error.message || 'An unknown error occurred.',
            });
        } finally {
            setIsAlertOpen(false);
            setDeletingInvoice(null);
        }
    };
    
    const selectedBooking = useMemo(() => {
        if (!selectedInvoice || !bookings) return null;
        return bookings.find(b => b.id === selectedInvoice.bookingId) ?? null;
    }, [selectedInvoice, bookings]);

    const selectedClient = useMemo(() => {
        if (!selectedInvoice || !users) return null;
        const clientUser = users.find(u => u.id === selectedInvoice.clientId);
        if (clientUser) return clientUser;
        return { id: selectedInvoice.clientId, name: selectedInvoice.clientId, email: '', role: 'Driver', avatarUrl: '' };
    }, [selectedInvoice, users]);


    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
                        <p className="text-muted-foreground">View, manage, and print invoices.</p>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as InvoiceStatus | 'All')}>
                                <TabsList className="flex flex-wrap h-auto justify-start">
                                    {invoiceStatuses.map(status => (
                                        <TabsTrigger key={status} value={status} className="capitalize">{status}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                             <Input
                                placeholder="Search by client, invoice, or booking..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Booking ID</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Gross Sales</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredInvoices.map(invoice => {
                                    const client = users?.find(u => u.id === invoice.clientId);
                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">#{invoice.id.substring(0, 7).toUpperCase()}</TableCell>
                                            <TableCell className="font-mono text-xs">{invoice.bookingId.substring(0, 7).toUpperCase()}</TableCell>
                                            <TableCell>{client?.name || invoice.clientId}</TableCell>
                                            <TableCell>{format(parseISO(invoice.dueDate), 'PP')}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(invoice.grossSales)}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[invoice.status].variant as any} className={statusConfig[invoice.status].className}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                                                        <FileText className="mr-2 h-4 w-4" /> View
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Paid')} disabled={invoice.status === 'Paid'}>
                                                                Mark as Paid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Unpaid')} disabled={invoice.status === 'Unpaid'}>
                                                                Mark as Unpaid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Overdue')} disabled={invoice.status === 'Overdue'}>
                                                                Mark as Overdue
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleOpenDeleteDialog(invoice)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         { !isLoading && filteredInvoices.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">
                                    {searchQuery ? 'No invoices found for your search.' : 'No invoices found for this filter.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {selectedInvoice && selectedBooking && selectedClient && (
                 <InvoiceSheet 
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    invoice={selectedInvoice}
                    booking={selectedBooking}
                    client={selectedClient}
                 />
            )}
            {editingInvoice && (
                <InvoiceDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    invoice={editingInvoice}
                    onSave={handleSaveInvoice}
                />
            )}
             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the invoice{' '}
                    <span className="font-bold">#{deletingInvoice?.id.substring(0, 7).toUpperCase()}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive hover:bg-destructive/90">
                    Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
