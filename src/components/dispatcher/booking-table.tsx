
"use client";

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import type { Booking, BookingStatus, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { BookingTableActions } from './booking-table-actions';
import { Package, Truck, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { DataTableColumnHeader } from '../ui/data-table-column-header';
import { Button } from '../ui/button';

type BookingTableProps = {
  bookings: Booking[];
  isLoading: boolean;
  onEdit: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
  onDelete: (booking: Booking) => void;
  filterStatus: BookingStatus | 'All';
  setFilterStatus: (status: BookingStatus | 'All') => void;
  onRowClick: (bookingId: string) => void;
  selectedBookingId: string | null;
  users: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onDownload: (table: any) => void;
};

const statusConfig: Record<BookingStatus, { variant: 'secondary' | 'default' | 'destructive' | 'outline', icon: React.ElementType, className: string }> = {
  pending: { variant: 'secondary', icon: Package, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  'En Route': { variant: 'default', icon: Truck, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Pending Verification': { variant: 'outline', icon: Clock, className: 'bg-purple-100 text-purple-800' },
  Delivered: { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
};

const bookingStatuses: (BookingStatus | 'All')[] = ['All', 'pending', 'En Route', 'Pending Verification', 'Delivered', 'cancelled'];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

function Filter({ column }: { column: any }) {
    const columnFilterValue = column.getFilterValue();

    return (
        <Input
        type="text"
        value={(columnFilterValue ?? '') as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Search...`}
        className="w-full border-slate-200 shadow h-8 text-xs"
        onClick={(e) => e.stopPropagation()} // Prevent row click
        />
    );
}

export function BookingTable({ bookings, isLoading, onEdit, onUpdateStatus, onDelete, filterStatus, setFilterStatus, onRowClick, selectedBookingId, users, searchQuery, setSearchQuery, onDownload }: BookingTableProps) {
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Booking>[] = React.useMemo(() => [
    {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking ID" />,
        cell: ({ row }) => (
            <div>
                <div className="font-mono text-xs">{row.original.id}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(row.original.bookingDate), "PP")}</div>
            </div>
        )
    },
    {
        accessorKey: 'clientId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    },
    {
        id: 'route',
        header: 'Route',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.original.pickupLocation}</span>
                <span className="text-muted-foreground">to {row.original.dropoffLocation}</span>
            </div>
        )
    },
    {
        id: 'driverName',
        accessorFn: (row) => {
            const driver = users.find(u => u.id === row.driverId);
            return driver ? driver.name : 'Unassigned';
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Driver" />,
    },
    {
        accessorKey: 'bookingRate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking Rate" />,
        cell: ({ row }) => <div className="font-medium text-right">{formatCurrency(row.original.bookingRate)}</div>
    },
    {
        id: 'totalExpenses',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Expenses" />,
        cell: ({ row }) => {
            const total = (row.original.driverRate || 0) +
                          (row.original.expectedExpenses?.tollFee || 0) +
                          (row.original.expectedExpenses?.fuel || 0) +
                          (row.original.expectedExpenses?.others || 0);
            return <div className="text-destructive text-right">{formatCurrency(total)}</div>;
        }
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const config = statusConfig[status];
            if (!config) return <Badge variant="outline">{status}</Badge>;
            const StatusIcon = config.icon;
            return (
                <Badge variant={config.variant as any} className={cn('whitespace-nowrap capitalize', config.className)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status}
                </Badge>
            );
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => <BookingTableActions booking={row.original} onEdit={onEdit} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />,
    },
  ], [users, onEdit, onUpdateStatus, onDelete]);

  const table = useReactTable({
    data: bookings,
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

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm flex-1 flex flex-col">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'All')}>
          <TabsList className="flex flex-wrap h-auto justify-start">
            {bookingStatuses.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize">{status}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
            <Input
            placeholder="Global search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm h-9"
            />
             <Button variant="outline" size="sm" onClick={() => onDownload(table)}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
            </Button>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{minWidth: header.getSize()}}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {!header.isPlaceholder && header.column.getCanFilter() ? (
                        <div className="mt-1">
                            <Filter column={header.column} />
                        </div>
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick(row.original.id!)}
                  className={cn(
                    "cursor-pointer",
                    selectedBookingId === row.original.id && "bg-muted/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    