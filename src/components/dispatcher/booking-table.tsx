"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
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
import { users, vehicles } from '@/lib/data';
import type { Booking, BookingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BookingTableActions } from './booking-table-actions';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

type BookingTableProps = {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
  filterStatus: BookingStatus | 'All';
  setFilterStatus: (status: BookingStatus | 'All') => void;
  onRowClick: (bookingId: string) => void;
  selectedBookingId: string | null;
};

const statusConfig: Record<BookingStatus, { variant: 'secondary' | 'default' | 'destructive' | 'outline', icon: React.ElementType, className: string }> = {
  Pending: { variant: 'secondary', icon: Package, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  'En Route': { variant: 'default', icon: Truck, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Pending Verification': { variant: 'outline', icon: Clock, className: 'bg-purple-100 text-purple-800 border-purple-200' },
  Delivered: { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
  Cancelled: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
};

const bookingStatuses: (BookingStatus | 'All')[] = ['All', 'Pending', 'En Route', 'Pending Verification', 'Delivered', 'Cancelled'];

export function BookingTable({ bookings, onEdit, onUpdateStatus, filterStatus, setFilterStatus, onRowClick, selectedBookingId }: BookingTableProps) {
  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm flex-1 flex flex-col">
        <div className="p-4 border-b">
            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'All')}>
                <TabsList className="flex flex-wrap h-auto justify-start">
                    {bookingStatuses.map(status => (
                         <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
      <div className="overflow-auto flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length > 0 ? (
            bookings.map(booking => {
              const driver = booking.driverId ? users.find(u => u.id === booking.driverId) : null;
              const vehicle = booking.vehicleId ? vehicles.find(v => v.id === booking.vehicleId) : null;
              const currentStatusConfig = statusConfig[booking.status];
              const StatusIcon = currentStatusConfig.icon;

              return (
                <TableRow 
                  key={booking.id}
                  onClick={() => onRowClick(booking.id)}
                  className={cn(
                    "cursor-pointer",
                    selectedBookingId === booking.id && "bg-muted/50"
                  )}
                >
                  <TableCell className="font-medium">#{booking.id.substring(8, 12)}</TableCell>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{booking.pickupAddress}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(booking.pickupTime), "PPp")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{booking.deliveryAddress}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(booking.deliveryTime), "PPp")}</span>
                    </div>
                  </TableCell>
                  <TableCell>{driver?.name || 'Unassigned'}</TableCell>
                  <TableCell>{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unassigned'}</TableCell>
                  <TableCell>
                    <Badge variant={currentStatusConfig.variant} className={cn('whitespace-nowrap', currentStatusConfig.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BookingTableActions booking={booking} onEdit={onEdit} onUpdateStatus={onUpdateStatus} />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No bookings found for this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
