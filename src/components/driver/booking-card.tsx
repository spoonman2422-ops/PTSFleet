"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Booking, BookingStatus, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin, ArrowRight, Play, CheckCircle2, Package, Clock, Send } from "lucide-react";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useUser } from "@/context/user-context";


type BookingCardProps = {
  booking: Booking;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onClick: () => void;
  isSelected: boolean;
};

const statusConfig = {
    Pending: { variant: "secondary", icon: Package, className: "bg-amber-100 text-amber-800" },
    "En Route": { variant: "default", icon: ArrowRight, className: "bg-blue-100 text-blue-800 animate-pulse" },
    "Pending Verification": { variant: "outline", icon: Clock, className: "bg-purple-100 text-purple-800" },
    Delivered: { variant: "default", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
    Cancelled: { variant: "destructive", icon: Package, className: "bg-red-100 text-red-800" },
};

export function BookingCard({ booking, onStatusChange, onClick, isSelected }: BookingCardProps) {
  const currentStatusConfig = statusConfig[booking.status];
  const StatusIcon = currentStatusConfig.icon;
  const firestore = useFirestore();
  const { user } = useUser();

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    if(booking.status === 'Pending'){
        onStatusChange(booking.id, 'En Route');
    } else if (booking.status === 'En Route'){
        onStatusChange(booking.id, 'Pending Verification')
        if (user && firestore) {
          const messagesPath = `bookings/${booking.id}/messages`;
          const messageData = {
            text: `Delivery for booking #${booking.id.substring(8, 12)} is complete. Awaiting dispatcher verification.`,
            senderId: 'system',
            senderName: 'System Bot',
            bookingId: booking.id,
            createdAt: serverTimestamp(),
          };
          await addDoc(collection(firestore, messagesPath), messageData);
        }
    }
  }

  return (
    <Card 
        onClick={onClick}
        className={cn(
            "flex flex-col transition-all hover:shadow-lg cursor-pointer",
            isSelected && "ring-2 ring-primary"
        )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">Booking #{booking.id.split('-')[1]}</CardTitle>
                <CardDescription>{booking.customerName}</CardDescription>
            </div>
          <Badge variant={currentStatusConfig.variant as any} className={cn("whitespace-nowrap", currentStatusConfig.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary"/>
                <div>
                    <p className="font-medium">Pickup</p>
                    <p className="text-muted-foreground">{booking.pickupAddress}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(booking.pickupTime), "PPPp")}</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-accent"/>
                <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-muted-foreground">{booking.deliveryAddress}</p>
                     <p className="text-xs text-muted-foreground">{format(new Date(booking.deliveryTime), "PPPp")}</p>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        {booking.status === 'Pending' && (
          <Button className="w-full" onClick={handleActionClick}>
            <Play className="mr-2 h-4 w-4" />
            Start Trip
          </Button>
        )}
        {booking.status === 'En Route' && (
          <Button className="w-full" onClick={handleActionClick} variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Complete Delivery
          </Button>
        )}
        {booking.status === 'Pending Verification' && (
            <Button className="w-full" disabled variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Pending Dispatch Verification
            </Button>
        )}
        {['Delivered', 'Cancelled'].includes(booking.status) && (
             <p className="text-sm text-muted-foreground w-full text-center">This job is complete.</p>
        )}
      </CardFooter>
    </Card>
  );
}
