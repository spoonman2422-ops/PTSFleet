
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Invoice, User, Booking, InvoiceStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal, Trash2, Edit, Download } from 'lucide-react';
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
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';


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
    
    const [sorting, setSorting] = useState<SortingState>([
      { id: "dueDate", desc: true }
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const { toast } = useToast();

    const sortedInvoices = useMemo(() => {
        if (!invoices) return [];
        return invoices.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        let filtered = sortedInvoices;
        if (filterStatus !== 'All') {
            filtered = filtered.filter(i => i.status === filterStatus);
        }
        return filtered;
    }, [sortedInvoices, filterStatus]);
    
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

    const columns: ColumnDef<Invoice>[] = useMemo(() => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
        cell: ({ row }) => <div className="font-medium">#{row.original.id.substring(0, 7).toUpperCase()}</div>
      },
      {
        id: 'clientName',
        accessorFn: (row) => users?.find(u => u.id === row.clientId)?.name || row.clientId,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ row }) => format(parseISO(row.original.dueDate), 'PP')
      },
      {
        accessorKey: 'grossSales',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gross Sales" />,
        cell: ({ row }) => <div className="text-right">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.original.grossSales)}</div>
      },
      {
        id: 'netProfit',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Net Profit" />,
        cell: ({ row }) => {
          const invoice = row.original;
          const booking = bookings?.find(b => b.id === invoice.bookingId);
          if (!booking) return <div className="text-right text-muted-foreground">N/A</div>;

          const costs = (booking.driverRate || 0) + (booking.expectedExpenses.tollFee || 0) + (booking.expectedExpenses.fuel || 0) + (booking.expectedExpenses.others || 0);
          const profit = booking.bookingRate - costs;
          
          return (
            <div className={cn("text-right font-medium", profit >= 0 ? "text-green-600" : "text-destructive")}>
              {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(profit)}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusConfig[status].variant as any} className={statusConfig[status].className}>
              {status}
            </Badge>
          );
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const invoice = row.original;
          return (
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
          );
        }
      }
    ], [users, bookings]);

    const table = useReactTable({
      data: filteredInvoices,
      columns,
      state: {
        sorting,
        columnFilters,
        globalFilter: searchQuery,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setSearchQuery,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    });

    const handleDownload = () => {
      const dataToExport = table.getFilteredRowModel().rows.map(row => {
          const original = row.original;
          const booking = bookings?.find(b => b.id === original.bookingId);
          const costs = (booking?.driverRate || 0) + (booking?.expectedExpenses.tollFee || 0) + (booking?.expectedExpenses.fuel || 0) + (booking?.expectedExpenses.others || 0);
          const netProfit = booking ? booking.bookingRate - costs : 0;
          return {
              "Invoice #": original.id.substring(0, 7).toUpperCase(),
              "Client": users?.find(u => u.id === original.clientId)?.name || original.clientId,
              "Due Date": format(parseISO(original.dueDate), 'yyyy-MM-dd'),
              "Gross Sales": original.grossSales,
              "Net Profit": netProfit,
              "Status": original.status,
          };
      });

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
                        <p className="text-muted-foreground">View, manage, and print invoices.</p>
                    </div>
                     <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download as CSV
                    </Button>
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
                                placeholder="Search all columns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                        )}
                                    </TableHead>
                                    ))}
                                </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={columns.length}><Skeleton className="h-8 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                }
                                 { !isLoading && table.getRowModel().rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            {searchQuery ? 'No invoices found for your search.' : 'No invoices found for this filter.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
