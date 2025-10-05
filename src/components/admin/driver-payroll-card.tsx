
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
import type { Booking, User, CashAdvance } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Printer, MinusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

type DriverPayrollCardProps = {
  driver: User;
  bookings: Booking[];
  cashAdvances: CashAdvance[];
  totalPay: number;
  totalCashAdvance: number;
  netPay: number;
  weekStart: Date;
  weekEnd: Date;
};

export function DriverPayrollCard({
  driver,
  bookings,
  cashAdvances,
  totalPay,
  totalCashAdvance,
  netPay,
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
                .no-print {
                    display: none !important;
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
        <CardContent className="flex-1 space-y-4 text-sm overflow-y-auto max-h-60">
            {bookings.length > 0 && (
                <div>
                    <p className="font-semibold text-muted-foreground">Completed Bookings:</p>
                    {bookings.map(booking => (
                        <div key={booking.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">#{booking.id?.substring(0, 4)} - {booking.dropoffLocation}</p>
                            </div>
                            <p className="font-mono">{formatCurrency(booking.driverRate)}</p>
                        </div>
                    ))}
                </div>
            )}
             {cashAdvances.length > 0 && (
                <div>
                    <p className="font-semibold text-muted-foreground">Cash Advances:</p>
                    {cashAdvances.map(ca => (
                        <div key={ca.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium flex items-center gap-2">
                                    <MinusCircle className="h-3 w-3 text-destructive"/>
                                    <span>CA on {format(parseISO(ca.date), 'MMM d')}</span>
                                </p>
                            </div>
                            <p className="font-mono text-destructive">-{formatCurrency(ca.amount)}</p>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
          <div className="w-full space-y-1 text-sm">
             <div className="flex justify-between w-full">
                <span>Gross Pay</span>
                <span>{formatCurrency(totalPay)}</span>
            </div>
             <div className="flex justify-between w-full">
                <span>Deductions</span>
                <span className="text-destructive">-{formatCurrency(totalCashAdvance)}</span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between w-full font-bold text-lg">
            <span>Net Pay</span>
            <span className="text-primary">{formatCurrency(netPay)}</span>
          </div>
          <Button onClick={handlePrint} className="w-full no-print" variant="outline">
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
            
            <h3 className="font-bold mb-2 text-sm">Earnings</h3>
            <table className="w-full text-sm mb-6">
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

            {cashAdvances.length > 0 && (
                <>
                    <h3 className="font-bold mb-2 text-sm">Deductions</h3>
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr className="text-left">
                                <th className="py-2">Date</th>
                                <th className="py-2">Description</th>
                                <th className="text-right py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashAdvances.map(ca => (
                                <tr key={ca.id} className="border-b">
                                    <td className="py-2">{format(parseISO(ca.date), 'PP')}</td>
                                    <td className="py-2">Cash Advance</td>
                                    <td className="text-right py-2 text-red-600">-{formatCurrency(ca.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}


            <div className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Gross Pay:</span>
                        <span>{formatCurrency(totalPay)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">-{formatCurrency(totalCashAdvance)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Net Pay:</span>
                        <span>{formatCurrency(netPay)}</span>
                    </div>
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
