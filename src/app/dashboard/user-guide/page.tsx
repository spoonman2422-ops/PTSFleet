
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldQuestion } from 'lucide-react';

export default function UserGuidePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ShieldQuestion className="h-12 w-12 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">PTSFleetSystem User Guide</h1>
            <p className="text-muted-foreground">Your guide to navigating the fleet management system.</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <GuideSection title="1. Introduction">
          <p>Welcome to the PTSFleetSystem! This application is designed to streamline the operations of Platinum Trucking Services by managing bookings, dispatch, payroll, and financial tracking in one centralized platform. This guide will walk you through the key features and functionalities available to different user roles.</p>
        </GuideSection>

        <GuideSection title="2. User Roles">
          <p>The system has three distinct user roles, each with specific permissions:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Admin:</strong> Has full access to all system features, including user management, financial data, and all booking operations.</li>
            <li><strong>Dispatcher:</strong> Can create, manage, and assign bookings to drivers. They are the primary coordinators of the fleet's daily operations.</li>
            <li><strong>Driver:</strong> Can view their assigned bookings, update the status of their trips, and communicate with dispatchers.</li>
          </ul>
        </GuideSection>

        <GuideSection title="3. Admin Guide">
            <h3 className="font-semibold text-lg mb-2">3.1 User Management</h3>
            <p>The Admin can create, edit, and delete user accounts. When creating a user, you must assign them a role. If the role is 'Driver', you can also assign a specific vehicle from the fleet to them.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">3.2 Booking Management</h3>
            <p>Admins have full control over all bookings. This includes creating new bookings, editing existing ones, deleting bookings, and updating their status. Deleting a booking will also remove all associated data, including messages and expenses.</p>
             <h3 className="font-semibold text-lg mt-4 mb-2">3.3 Vehicle Management</h3>
            <p>Here you can manage the entire vehicle fleet. Add new vehicles with details like make, model, plate number, and amortization schedules. You can also update the status of vehicles (e.g., 'Active', 'Under Maintenance').</p>
             <h3 className="font-semibold text-lg mt-4 mb-2">3.4 Invoices</h3>
            <p>This section lists all invoices generated from completed bookings. You can view invoice details, print them, and manually update their status (e.g., from 'Unpaid' to 'Paid').</p>
             <h3 className="font-semibold text-lg mt-4 mb-2">3.5 Payroll</h3>
            <p>The payroll page calculates weekly pay for each driver based on their completed bookings for the selected week. It also allows you to log and deduct cash advances from their net pay.</p>
             <h3 className="font-semibold text-lg mt-4 mb-2">3.6 Expense Management</h3>
            <p>Log all business-related expenses here, such as fuel, maintenance, or office supplies. Expenses can be categorized for better tracking and financial analysis.</p>
             <h3 className="font-semibold text-lg mt-4 mb-2">3.7 Financials</h3>
            <p>This dashboard provides a comprehensive overview of the company's financial health, including profit/margin tracking, outstanding payments, cash on hand, and profitability broken down by vehicle type.</p>
        </GuideSection>
        
        <GuideSection title="4. Dispatcher Guide">
            <h3 className="font-semibold text-lg mb-2">4.1 Dashboard & Booking Management</h3>
            <p>The dispatcher's main view is the booking management table. Here you can:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Create a <strong>New Booking</strong>, which automatically generates a unique Booking ID based on the client.</li>
                <li>Assign drivers to bookings.</li>
                <li>Filter bookings by status (e.g., 'pending', 'En Route').</li>
                <li>Update the status of a booking (e.g., mark as 'Delivered'). When a booking is marked as 'Delivered', an invoice is automatically generated.</li>
            </ul>
             <h3 className="font-semibold text-lg mt-4 mb-2">4.2 Message Board</h3>
            <p>Click on any booking in the table to open the message board for that specific job. This allows for direct communication with the assigned driver, ensuring clear instructions and updates.</p>
        </GuideSection>

        <GuideSection title="5. Driver Guide">
            <h3 className="font-semibold text-lg mb-2">5.1 Viewing Assigned Bookings</h3>
            <p>Your dashboard displays all bookings currently assigned to you. Each card shows key details like pickup/delivery locations and dates.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.2 Updating Booking Status</h3>
            <p>You are responsible for updating the job status:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Click <strong>Start Trip</strong> when you begin a job to change the status to 'En Route'.</li>
                <li>Click <strong>Complete Delivery</strong> when you have finished the job. The status will change to 'Pending Verification', and a notification will be sent to the dispatcher.</li>
            </ul>
             <h3 className="font-semibold text-lg mt-4 mb-2">5.3 Communication</h3>
            <p>Click on a booking card to open the message board. Here you can send and receive messages and images directly with the dispatcher for that specific job.</p>
        </GuideSection>
      </div>
    </div>
  );
}

const GuideSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            {children}
        </CardContent>
    </Card>
)
