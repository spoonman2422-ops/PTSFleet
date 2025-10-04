
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Invoice, User, Booking, InvoiceStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Printer, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceSheet } from '@/components/admin/invoice-sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';


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
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');

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
                 return clientNameMatch || invoiceIdMatch;
            });
        }
        return filtered;
    }, [sortedInvoices, filterStatus, searchQuery, users]);
    
    const isLoading = isLoadingInvoices || isLoadingUsers || isLoadingBookings;

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsSheetOpen(true);
    };

    const handleUpdateStatus = async (invoiceId: string, status: InvoiceStatus) => {
        if (!firestore) return;
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        try {
            await updateDoc(invoiceRef, { status });
            toast({
                title: 'Invoice Status Updated',
                description: `Invoice #${invoiceId.substring(0,4)} has been marked as ${status}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating status',
                description: (error as Error).message,
            });
        }
    };
    
    const selectedBooking = useMemo(() => {
        if (!selectedInvoice || !bookings) return null;
        return bookings.find(b => b.id === selectedInvoice.bookingId) ?? null;
    }, [selectedInvoice, bookings]);

    const selectedClient = useMemo(() => {
        if (!selectedInvoice || !users) return null;
        // Find user by clientID from the invoice itself
        const clientUser = users.find(u => u.id === selectedInvoice.clientId);
        if (clientUser) return clientUser;

        // Fallback for older data or if user is not in the users collection
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
                                placeholder="Search by client or invoice #"
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
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Paid')} disabled={invoice.status === 'Paid'}>
                                                                Mark as Paid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Unpaid')} disabled={invoice.status === 'Unpaid'}>
                                                                Mark as Unpaid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Overdue')} disabled={invoice.status === 'Overdue'}>
                                                                Mark as Overdue
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
        </>
    );
}

    