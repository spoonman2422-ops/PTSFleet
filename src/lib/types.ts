
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Dispatcher' | 'Driver';

export type BookingStatus = 'pending' | 'En Route' | 'Pending Verification' | 'Delivered' | 'cancelled';
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';
export type VehicleType = '6-Wheel' | 'AUV';
export type VehicleStatus = 'Active' | 'Under Maintenance' | 'Decommissioned';
export type OwnerName = "Manel" | "Meann" | "Egay" | "Nalyn" | "Mae" | "Florly";


export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  vehicleId?: string | null;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
  ownerName: string;
  dateAcquired: string;
  nextMaintenanceDate: string;
  amortizationSchedule: string;
  amortizationEndDate: string;
  status: VehicleStatus;
}

export interface Booking {
  id?: string;
  clientId: string;
  driverId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  bookingDate: string;
  billingDate: string;
  completionDate?: string;
  dueDate: string;
  grossBookingRate: number;
  bookingRate: number;
  ewtApplied: boolean;
  driverRate: number;
  vehicleType: VehicleType;
  expensePaymentMethod: 'PTS' | 'Credit';
  expenseCreditedTo: OwnerName | null;
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
    ewtApplied: boolean;
    ewtAmount: number;
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

export type ExpenseCategory = "Bank Transfer fee" | "cash advance" | "change oil" | "client representation" | "driver payroll" | "driver rate" | "fuel" | "maintenance" | "miscellaneous" | "office" | "permits" | "pms" | "staff" | "toll" | "Vehicle Related Expense" | "vehicle parts";

export interface Expense {
  id: string;
  bookingId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vatIncluded: boolean;
  vatRate: number;
  inputVat: number;
  dateIncurred: string;
  paidBy: "cash" | "bank" | "PTS";
  creditedTo?: OwnerName | null;
  addedBy: string;
  notes?: string;
}

export type ReimbursementStatus = 'Pending' | 'Liquidated';

export interface Reimbursement {
  id: string;
  bookingId?: string | null;
  cashAdvanceId?: string | null;
  driverId?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  dateIncurred: string;
  creditedTo: OwnerName;
  status: ReimbursementStatus;
  addedBy: string;
  liquidatedAt?: string | null;
  liquidatedBy?: string | null;
  notes?: string | null;
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
  paidBy: 'PTS' | 'Credit';
  creditedTo?: OwnerName | null;
  addedBy: string;
}

export type ActivityAction = 
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_DELETED' | 'BOOKING_STATUS_CHANGED'
  | 'INVOICE_CREATED' | 'INVOICE_UPDATED' | 'INVOICE_DELETED' | 'INVOICE_STATUS_CHANGED'
  | 'EXPENSE_CREATED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED'
  | 'REIMBURSEMENT_CREATED' | 'REIMBURSEMENT_LIQUIDATED'
  | 'VEHICLE_CREATED' | 'VEHICLE_UPDATED' | 'VEHICLE_DELETED'
  | 'CASH_ADVANCE_CREATED' | 'CASH_ADVANCE_UPDATED'
  | 'REVOLVING_FUND_CREATED' | 'REVOLVING_FUND_UPDATED'
  | 'LOGIN_SUCCESS';

export type EntityType = 'User' | 'Booking' | 'Invoice' | 'Expense' | 'Vehicle' | 'CashAdvance' | 'RevolvingFund' | 'Auth' | 'Reimbursement';


export interface ActivityLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId: string;
    details: string;
}
