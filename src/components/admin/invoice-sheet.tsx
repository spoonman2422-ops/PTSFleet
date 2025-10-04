
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppLogo } from '@/components/icons';
import { Printer } from 'lucide-react';
import type { Invoice, Booking, User } from '@/lib/types';
import { format, parseISO } from 'date-fns';

type InvoiceSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  booking: Booking | null;
  client: User | null;
};

export function InvoiceSheet({ isOpen, onOpenChange, invoice, booking, client }: InvoiceSheetProps) {
  
  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice-area');
    if (printContent) {
        const originalContents = document.body.innerHTML;
        const printHtml = printContent.innerHTML;
        
        document.body.innerHTML = `
            <html>
                <head>
                    <title>Print Invoice</title>
                    <link rel="stylesheet" href="/globals.css" type="text/css" />
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printHtml}
                </body>
            </html>
        `;
        
        window.print();
        document.body.innerHTML = originalContents;
        // The sheet closing needs to be re-bound after we restore content
        onOpenChange(false);
        window.location.reload(); 
    }
  };

  if (!invoice || !booking || !client) {
    return null;
  }

  const invoiceCreationDate = invoice.createdAt ? invoice.createdAt.toDate() : new Date();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <div id="printable-invoice-area">
          <SheetHeader className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <AppLogo className="w-16 h-16 text-primary" />
                <SheetTitle className="text-3xl font-bold mt-4">Invoice</SheetTitle>
                <SheetDescription>Invoice # {invoice.id.substring(0, 7).toUpperCase()}</SheetDescription>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">Platinum Trucking Services</h3>
                <p className="text-sm text-muted-foreground">
                  BLOCK 8 LOT 33 PHASE 1 BISMUTH ST. <br />
                  STA. ELENA VILLAGE, BRGY. SAN JOSE, ANTIPOLO CITY <br />
                  platinum.trucking.services1@gmail.com <br />
                  09171900017
                </p>
              </div>
            </div>
          </SheetHeader>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <h4 className="font-semibold mb-2">Bill To:</h4>
                <p className="font-bold">{client.name}</p>
                <p>{client.email}</p>
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">Invoice Date:</span>{' '}
                  {format(invoiceCreationDate, 'PP')}
                </p>
                <p>
                  <span className="font-semibold">Due Date:</span>{' '}
                  {format(parseISO(invoice.dueDate), 'PP')}
                </p>
              </div>
            </div>
            <Separator />
            <table className="w-full text-sm mt-8">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-semibold py-2">Description</th>
                  <th className="text-right font-semibold py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4">
                    <p className="font-medium">Transport Services</p>
                    <p className="text-muted-foreground text-xs">
                        Booking ID: #{booking.id?.substring(0,7).toUpperCase()}<br/>
                        Route: {booking.pickupLocation} to {booking.dropoffLocation}<br/>
                        Date: {format(parseISO(booking.bookingDate), 'PP')}
                    </p>
                  </td>
                  <td className="py-4 text-right">
                    {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end mt-8">
              <div className="w-full max-w-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal</span>
                  <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(invoice.amount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(invoice.amount)}</span>
                </div>
              </div>
            </div>
             <div className="mt-16 text-center text-muted-foreground text-xs">
                <p>Thank you for your business!</p>
                <p>Please make payment by the due date.</p>
            </div>
          </div>
        </div>
        <SheetFooter className="p-6 pt-0 border-t-0 no-print">
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
