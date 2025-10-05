
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Booking, User } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

type DriverPayrollCardProps = {
  driver: User;
  bookings: Booking[];
  totalPay: number;
  weekStart: Date;
  weekEnd: Date;
};

export function DriverPayrollCard({
  driver,
  bookings,
  totalPay,
  weekStart,
  weekEnd,
}: DriverPayrollCardProps) {

  const handlePrint = () => {
    const printableArea = document.getElementById(`payslip-${driver.id}`);
    if (!printableArea) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write('<html><head><title>Print Payslip</title>');
    Array.from(document.styleSheets).forEach(styleSheet => {
      if (styleSheet.href) {
        doc.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
      } else if (styleSheet.cssRules) {
        doc.write('<style>');
        doc.write(Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n'));
        doc.write('</style>');
      }
    });
     doc.write(`
        <style>
            @media print {
                body {
                    margin: 0;
                    padding: 1.5rem;
                    background-color: white;
                }
                .printable-area {
                    max-width: 100%;
                    margin: 0 auto;
                    overflow: hidden;
                    page-break-after: avoid;
                }
            }
        </style>
    `);
    doc.write('</head><body style="background-color: white;">');
    doc.write(printableArea.innerHTML);
    doc.write('</body></html>');
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
  };
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{driver.name}</CardTitle>
              <CardDescription>
                Pay for {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm overflow-y-auto max-h-60">
            <p className="font-semibold text-muted-foreground">Completed Bookings:</p>
            {bookings.map(booking => (
                <div key={booking.id} className="flex justify-between items-center">
                    <div>
                        <p className="font-medium">#{booking.id?.substring(0, 4)}</p>
                        <p className="text-xs text-muted-foreground">{booking.dropoffLocation}</p>
                    </div>
                    <p className="font-mono">{formatCurrency(booking.driverRate)}</p>
                </div>
            ))}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
          <div className="flex justify-between w-full font-bold text-lg">
            <span>Total Pay</span>
            <span className="text-primary">{formatCurrency(totalPay)}</span>
          </div>
          <Button onClick={handlePrint} className="w-full" variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Payslip
          </Button>
        </CardFooter>
      </Card>
      
      {/* Hidden printable element */}
      <div className="hidden">
        <div id={`payslip-${driver.id}`} className="printable-area p-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Platinum Trucking Services</h1>
                <p className="text-muted-foreground">Driver Payslip</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <p><span className="font-semibold">Driver:</span> {driver.name}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Pay Period:</span></p>
                    <p>{format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}</p>
                </div>
            </div>
            
            <table className="w-full text-sm">
                <thead className="border-b">
                    <tr className="text-left">
                        <th className="py-2">Completion Date</th>
                        <th className="py-2">Booking ID</th>
                        <th className="py-2">Route</th>
                        <th className="text-right py-2">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking.id} className="border-b">
                            <td className="py-2">{format(parseISO(booking.completionDate!), 'PP')}</td>
                            <td className="py-2">#{booking.id?.substring(0, 7).toUpperCase()}</td>
                            <td className="py-2">{booking.pickupLocation} to {booking.dropoffLocation}</td>
                            <td className="text-right py-2">{formatCurrency(booking.driverRate)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end mt-6">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Gross Pay:</span>
                        <span>{formatCurrency(totalPay)}</span>
                    </div>
                    <Separator />
                     <div className="pt-16">
                        <Separator />
                        <p className="text-center text-xs pt-2">Driver Signature</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
