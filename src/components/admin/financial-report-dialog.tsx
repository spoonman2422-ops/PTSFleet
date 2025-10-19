
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer } from 'lucide-react';
import { AppLogo } from '../icons';

export type ReportData = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
};

type FinancialReportDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReportData | null;
};

export function FinancialReportDialog({ isOpen, onOpenChange, data }: FinancialReportDialogProps) {
  if (!data) return null;

  const handlePrint = () => {
    const printableArea = document.getElementById('printable-report-area');
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
    doc.write('<html><head><title>Print Report</title>');
    
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
                body { margin: 1.5rem; background-color: white; }
                .printable-area { max-width: 100%; margin: 0 auto; overflow: hidden; page-break-after: avoid; }
                .no-print { display: none !important; }
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <div id="printable-report-area" className="printable-area">
          <DialogHeader className="mb-4">
            <div className="flex justify-between items-start">
                <div>
                    <AppLogo width={64} height={64} className="mb-4" />
                    <DialogTitle className="text-2xl">{data.title}</DialogTitle>
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
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.headers.map((header, index) => (
                    <TableHead key={index} className={index > 0 && (header.toLowerCase().includes('amount') || header.toLowerCase().includes('profit')) ? 'text-right' : ''}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.length > 0 ? data.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className={cellIndex > 0 && (data.headers[cellIndex].toLowerCase().includes('amount') || data.headers[cellIndex].toLowerCase().includes('profit')) ? 'text-right' : ''}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={data.headers.length} className="h-24 text-center">
                            No data available for this report.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
