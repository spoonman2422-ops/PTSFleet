import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Dispatcher' | 'Driver';

export type BookingStatus = 'Pending' | 'En Route' | 'Delivered' | 'Cancelled' | 'Pending Verification';

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
  id: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  deliveryTime: string;
  status: BookingStatus;
  driverId: string | null;
  vehicleId: string | null;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  bookingId: string;
  createdAt: Timestamp;
}
