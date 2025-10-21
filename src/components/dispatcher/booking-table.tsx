
"use client";

import * as React from 'react';
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
import { format } from 'date-fns';
import { BookingTableActions } from './booking-table-actions';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';

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

export function BookingTable({ bookings, isLoading, onEdit, onUpdateStatus, onDelete, filterStatus, setFilterStatus, onRowClick, selectedBookingId, users, searchQuery, setSearchQuery }: BookingTableProps) {
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
             <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
            />
        </div>
      <div className="overflow-auto flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Booking ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Booking Rate</TableHead>
            <TableHead>Total Expenses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : bookings.length > 0 ? (
            bookings.map(booking => {
              if (!booking.id || !booking.status) return null;
              const driver = booking.driverId ? users?.find(u => u.id === booking.driverId) : null;
              const currentStatusConfig = statusConfig[booking.status];
              if (!currentStatusConfig) {
                  // Gracefully handle unknown statuses to prevent crashes
                  return (
                     <TableRow key={booking.id}>
                        <TableCell colSpan={8}>Invalid booking status: {booking.status}</TableCell>
                     </TableRow>
                  )
              }
              const StatusIcon = currentStatusConfig.icon;

              const totalExpenses = (booking.driverRate || 0) +
                                    (booking.expectedExpenses?.tollFee || 0) +
                                    (booking.expectedExpenses?.fuel || 0) +
                                    (booking.expectedExpenses?.others || 0);

              return (
                <TableRow 
                  key={booking.id}
                  onClick={() => onRowClick(booking.id!)}
                  className={cn(
                    "cursor-pointer",
                    selectedBookingId === booking.id && "bg-muted/50"
                  )}
                >
                  <TableCell>
                      <div className="font-mono text-xs">{booking.id}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(booking.bookingDate), "PP")}</div>
                  </TableCell>
                  <TableCell>{booking.clientId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{booking.pickupLocation}</span>
                        <span className="text-muted-foreground">to {booking.dropoffLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell>{driver?.name || 'Unassigned'}</TableCell>
                   <TableCell className="font-medium">{formatCurrency(booking.bookingRate)}</TableCell>
                   <TableCell className="text-destructive">{formatCurrency(totalExpenses)}</TableCell>
                  <TableCell>
                    <Badge variant={currentStatusConfig.variant} className={cn('whitespace-nowrap capitalize', currentStatusConfig.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BookingTableActions booking={booking} onEdit={onEdit} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
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
