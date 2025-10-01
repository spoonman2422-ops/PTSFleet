"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Truck, CheckCircle2, XCircle, Package, Clock } from "lucide-react";
import type { Booking, BookingStatus } from "@/lib/types";

type BookingTableActionsProps = {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
};

export function BookingTableActions({ booking, onEdit, onUpdateStatus }: BookingTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(booking)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Booking</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Truck className="mr-2 h-4 w-4"/>
                <span>Change Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, 'Pending')} disabled={booking.status === 'Pending'}>
                    <Package className="mr-2 h-4 w-4"/>
                    Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, 'En Route')} disabled={booking.status === 'En Route'}>
                    <Truck className="mr-2 h-4 w-4"/>
                    En Route
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, 'Pending Verification')} disabled={booking.status === 'Pending Verification'}>
                    <Clock className="mr-2 h-4 w-4"/>
                    Pending Verification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(booking.id, 'Delivered')} disabled={booking.status === 'Delivered'}>
                    <CheckCircle2 className="mr-2 h-4 w-4"/>
                    Delivered
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={() => onUpdateStatus(booking.id, 'Cancelled')}
        >
          <XCircle className="mr-2 h-4 w-4" />
          <span>Cancel Booking</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
