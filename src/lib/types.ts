
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Dispatcher' | 'Driver';

export type BookingStatus = 'pending' | 'En Route' | 'Pending Verification' | 'Delivered' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

export interface Booking {
  id?: string;
  clientId: string;
  driverId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  bookingDate: string;
  collectionDate: string;
  dueDate: string;
  bookingRate: number;
  driverRate: number;
  expectedExpenses: {
    tollFee: number;
    fuel: number;
    others: number;
  };
  status: BookingStatus;
  proofOfDeliveryUrl?: string;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  bookingId: string;
  createdAt: Timestamp;
  imageUrl?: string;
}
