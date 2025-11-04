
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldQuestion, ClipboardList, Truck, PackageCheck, Pencil, FileText, Banknote, ArrowRight, GitPullRequest, HandCoins as ReimbursementIcon, Download, FileSpreadsheet, List, Activity } from 'lucide-react';

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

        <GuideSection title="2. What's New">
            <h2 className="text-xl font-bold mb-4">Version 3.1.1</h2>
            <ul className="list-disc pl-6 mt-2 space-y-3">
                <li>
                  <strong className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Enhanced Cash Advance Workflow</strong>
                  <p className="mt-1">The Payroll page now has an improved system for logging cash advances. You can now specify if an advance was paid by 'PTS' or by 'Credit' from an owner. Advances are now reflected on the driver's payslip immediately, while credit-based advances simultaneously generate a reimbursement request for the owner.</p>
                </li>
                 <li>
                  <strong className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Delete Cash Advances</strong>
                  <p className="mt-1">Admins can now delete cash advance entries directly from the history table on the Payroll page.</p>
                </li>
                <li>
                  <strong className="flex items-center gap-2"><Activity className="h-4 w-4" /> Admin Activity Log Activated</strong>
                  <p className="mt-1">The "Recent Activity" card on the Admin Dashboard is now fully functional. It logs all major actions within the system, such as creating bookings, updating users, and liquidating reimbursements, providing a clear audit trail.</p>
                </li>
                 <li>
                  <strong className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Report & UI Enhancements</strong>
                   <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>The "Upcoming Billings" card on the Financials page now correctly shows unpaid invoices due within the next 7 days and includes the Booking ID.</li>
                        <li>The Booking ID column has been added to the main Invoice Management table.</li>
                        <li>Fixed a bug that caused reports to print incorrectly (repeating pages).</li>
                        <li>Corrected an issue where automatically generated descriptions and notifications were not showing the full Booking ID.</li>
                        <li>Improved the Booking ID generation logic to correctly handle sequences (e.g., 'Flash10').</li>
                   </ul>
                </li>
            </ul>

            <h2 className="text-xl font-bold mt-8 mb-4">Version 3.1</h2>
            <ul className="list-disc pl-6 mt-2 space-y-3">
                <li>
                  <strong className="flex items-center gap-2"><Download className="h-4 w-4" /> CSV Downloads</strong>
                  <p className="mt-1">You can now download data from the Booking Management, Expense Management, and Reimbursement pages directly into a CSV file for your records or for external analysis.</p>
                </li>
                <li>
                  <strong className="flex items-center gap-2"><List className="h-4 w-4" /> Full Data View</strong>
                  <p className="mt-1">Pagination has been removed from the Expense and Reimbursement pages. All entries are now displayed at once, making it easier to view your data in conjunction with the powerful filter and sort features.</p>
                </li>
            </ul>

            <h2 className="text-xl font-bold mt-8 mb-4">Version 3.0</h2>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><GitPullRequest className="h-5 w-5" /> Reimbursement & Liquidation Workflow</h3>
            <p>To better track expenses paid by individuals on behalf of the company, a new reimbursement system has been introduced.</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Credit Expenses create Reimbursement Requests:</strong> When creating a new expense or logging mobilization costs for a booking, if the payment method is "Credit," it no longer goes directly into expenses. Instead, it creates a "Pending" request on the new <strong>Reimbursements</strong> page.</li>
                <li><strong>New Reimbursements Page (Admin):</strong> Admins can now manage all credit expense requests from the "Reimbursements & Liquidation" page. Here, you can view, edit, delete, and liquidate pending requests.</li>
                <li><strong>Liquidation Process:</strong> When an Admin clicks "Liquidate" on a pending request, the system automatically creates an official expense record in the Expense Management log and marks the original request as "Liquidated".</li>
            </ul>
             <h3 className="font-semibold text-lg mt-4 mb-2">Other Enhancements</h3>
             <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Added "Bank Transfer fee" to expense categories.</li>
                <li>Expense categories are now sorted alphabetically in forms.</li>
            </ul>
        </GuideSection>

        <GuideSection title="3. User Roles">
          <p>The system has three distinct user roles, each with specific permissions:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Admin:</strong> Has full access to all system features, including user management, financial data, and all booking operations.</li>
            <li><strong>Dispatcher:</strong> Can create, manage, and assign bookings to drivers. They are the primary coordinators of the fleet's daily operations.</li>
            <li><strong>Driver:</strong> Can view their assigned bookings, update the status of their trips, and communicate with dispatchers.</li>
          </ul>
        </GuideSection>

        <GuideSection title="4. Booking & Expense Workflow (Visualized)">
          <p className="mb-6">This is the typical lifecycle of a booking and its associated expenses from start to finish.</p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            <WorkflowStep icon={ClipboardList} title="Booking Logged" description="Admin or Dispatcher creates a new booking, assigning a driver and logging expected expenses (e.g., fuel, toll)." />
            <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 -rotate-90 md:rotate-0" />
            <WorkflowStep icon={Truck} title="Driver Mobilizes" description="Driver starts the trip, updating the status to 'En Route'." />
            <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 -rotate-90 md:rotate-0" />
            <WorkflowStep icon={PackageCheck} title="Delivery Complete" description="Driver completes the delivery and updates the status." />
          </div>
          <div className="flex justify-center my-4">
             <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 rotate-90" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
             <WorkflowStep icon={Pencil} title="Verification" description="Dispatcher verifies the delivery and marks the booking 'Delivered'." />
             <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 -rotate-90 md:rotate-0" />
             <WorkflowStep icon={FileText} title="Invoice Created" description="An invoice is automatically generated for the completed booking." />
             <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 -rotate-90 md:rotate-0" />
             <WorkflowStep icon={Banknote} title="Billing" description="Admin manages the invoice and tracks payment in the financials dashboard." />
          </div>
           <div className="flex justify-center my-4">
             <ArrowRight className="h-8 w-8 text-muted-foreground min-w-8 rotate-90" />
          </div>
           <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
               <WorkflowStep icon={ReimbursementIcon} title="Liquidation" description="Admin liquidates any credit-based expenses related to the booking, officially moving them to the expense log." />
           </div>
        </GuideSection>


        <GuideSection title="5. Admin Guide">
            <h3 className="font-semibold text-lg mb-2">5.1 User Management</h3>
            <p>The Admin can create, edit, and delete user accounts. When creating a user, you must assign them a role. If the role is 'Driver', you can also assign a specific vehicle from the fleet to them.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.2 Booking Management</h3>
            <p>Admins have full control over all bookings. This includes creating new bookings, editing existing ones, deleting bookings, and updating their status. Deleting a booking will also remove all associated data, including messages and expenses.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.3 Vehicle Management</h3>
            <p>Here you can manage the entire vehicle fleet. Add new vehicles with details like make, model, plate number, and amortization schedules. You can also update the status of vehicles (e.g., 'Active', 'Under Maintenance').</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.4 Invoices</h3>
            <p>This section lists all invoices generated from completed bookings. You can view invoice details, print them, and manually update their status (e.g., from 'Unpaid' to 'Paid').</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.5 Payroll</h3>
            <p>The payroll page calculates weekly pay for each driver based on their completed bookings for the selected week. It also allows you to log and deduct cash advances from their net pay.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.6 Expense & Reimbursement Management</h3>
            <p>In <strong>Expense Management</strong>, you can log all direct company expenses (paid by PTS, cash, or bank). In <strong>Reimbursements</strong>, you can manage and liquidate expenses paid via credit by individuals, which are then moved into the main expense log.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">5.7 Financials</h3>
            <p>This dashboard provides a comprehensive overview of the company's financial health, including profit/margin tracking, outstanding payments, cash on hand, and profitability broken down by vehicle type.</p>
        </GuideSection>
        
        <GuideSection title="6. Dispatcher Guide">
            <h3 className="font-semibold text-lg mb-2">6.1 Dashboard & Booking Management</h3>
            <p>The dispatcher's main view is the booking management table. Here you can:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Create a <strong>New Booking</strong>, which automatically generates a unique Booking ID based on the client.</li>
                <li>Assign drivers and set the expense payment method for mobilization costs (e.g. fuel, toll). If "Credit" is chosen, it will create a reimbursement request.</li>
                <li>Filter bookings by status (e.g., 'pending', 'En Route').</li>
                <li>Update the status of a booking (e.g., mark as 'Delivered'). When a booking is marked as 'Delivered', an invoice is automatically generated.</li>
            </ul>
             <h3 className="font-semibold text-lg mt-4 mb-2">6.2 Message Board</h3>
            <p>Click on any booking in the table to open the message board for that specific job. This allows for direct communication with the assigned driver, ensuring clear instructions and updates.</p>
        </GuideSection>

        <GuideSection title="7. Driver Guide">
            <h3 className="font-semibold text-lg mb-2">7.1 Viewing Assigned Bookings</h3>
            <p>Your dashboard displays all bookings currently assigned to you. Each card shows key details like pickup/delivery locations and dates.</p>
            <h3 className="font-semibold text-lg mt-4 mb-2">7.2 Updating Booking Status</h3>
            <p>You are responsible for updating the job status:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Click <strong>Start Trip</strong> when you begin a job to change the status to 'En Route'.</li>
                <li>Click <strong>Complete Delivery</strong> when you have finished the job. The status will change to 'Pending Verification', and a notification will be sent to the dispatcher.</li>
            </ul>
             <h3 className="font-semibold text-lg mt-4 mb-2">7.3 Communication</h3>
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
);

const WorkflowStep = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center gap-2 max-w-[200px]">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted border">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <h4 className="font-bold">{title}</h4>
        <p className="text-xs">{description}</p>
    </div>
);
