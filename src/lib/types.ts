
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Dispatcher' | 'Driver';

export type BookingStatus = 'pending' | 'En Route' | 'Pending Verification' | 'Delivered' | 'cancelled';
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';
export type VehicleType = '6-Wheel' | 'AUV';

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
  completionDate?: string;
  dueDate: string;
  bookingRate: number;
  driverRate: number;
  vehicleType: VehicleType;
  expectedExpenses: {
    tollFee: number;
    fuel: number;
    others: number;
  };
  status: BookingStatus;
  proofOfDeliveryUrl?: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    bookingId: string;
    grossSales: number;
    vatRegistered: boolean;
    vatRate: number;
    vatAmount: number;
    percentageTaxRate: number;
    percentageTaxAmount: number;
    incomeTaxOption: '8_percent_flat' | 'graduated';
    incomeTaxAmount: number;
    netRevenue: number;
    dateIssued: string;
    dueDate: string;
    status: InvoiceStatus;
    proofOfBillingUrl?: string;
    createdAt?: Timestamp;
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

export interface Expense {
  id: string;
  category: "fuel" | "maintenance" | "toll" | "office" | "staff" | "permits" | "vehicle parts" | "pms" | "change oil" | "client representation" | "driver/helper rate";
  description: string;
  amount: number;
  vatIncluded: boolean;
  vatRate: number;
  inputVat: number;
  dateIncurred: string;
  paidBy: "cash" | "bank" | "credit" | "PTS";
  addedBy: string;
  notes?: string;
}

export interface RevolvingFundContribution {
  id: string;
  contributorName: string;
  amount: number;
  contributionDate: string;
  addedBy: string;
}

export interface CashAdvance {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  addedBy: string;
}
