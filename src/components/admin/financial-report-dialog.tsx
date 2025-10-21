
"use client";

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as ReportFooter,
} from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { AppLogo } from '../icons';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { DataTableColumnHeader } from '../ui/data-table-column-header';
import { Input } from '../ui/input';


type ReportFooterRow = (string | number)[];

export type ReportData = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  total?: number;
  footer?: ReportFooterRow[];
};


type FinancialReportDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReportData | null;
};

export function FinancialReportDialog({ isOpen, onOpenChange, data }: FinancialReportDialogProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const columns: ColumnDef<any>[] = useMemo(() => {
    if (!data?.headers) return [];
    return data.headers.map((header, index) => ({
        id: header,
        accessorFn: (row: any) => row[index],
        header: ({ column }) => <DataTableColumnHeader column={column} title={header} />,
        cell: ({ row }) => {
            const value = row.original[index];
            const isCurrencyColumn = (typeof header === 'string' && (
                header.toLowerCase().includes('amount') || 
                header.toLowerCase().includes('profit') || 
                header.toLowerCase().includes('costs') || 
                header.toLowerCase().includes('revenue') ||
                header.toLowerCase().includes('rate')
            ));
            const isNumeric = typeof value === 'number';

            if (isCurrencyColumn && isNumeric) {
                return formatCurrency(value);
            }
            return value;
        },
    }));
  }, [data]);

  const tableData = useMemo(() => data?.rows || [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!data) return null;
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

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
                .dialog-content { 
                  max-height: none !important;
                  overflow-y: visible !important;
                }
                .report-content {
                    height: auto !important;
                    max-height: none !important;
                    overflow-y: visible !important;
                }
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col dialog-content">
        <div id="printable-report-area" className="printable-area flex-1 flex flex-col overflow-hidden">
          <DialogHeader className="mb-4 px-1">
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
          
          <div className="px-1 py-4 no-print">
            <Input
              placeholder="Search report..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="border rounded-md flex-1 overflow-y-auto report-content">
            <Table>
              <TableHeader>
                 {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className={typeof cell.getContext().getValue() === 'number' ? 'text-right' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
               {(data.total !== undefined || data.footer) && (
                  <ReportFooter>
                    {data.footer ? (
                      data.footer.map((footerRow, index) => (
                        <TableRow key={index}>
                          {footerRow.map((cell, cellIndex) => (
                            <TableCell 
                              key={cellIndex} 
                              className="text-right font-bold"
                              colSpan={cellIndex === 0 ? data.headers.length - (footerRow.length - 1) : 1}
                            >
                              {typeof cell === 'number' ? formatCurrency(cell) : cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : data.total !== undefined ? (
                      <TableRow>
                          <TableCell colSpan={data.headers.length - 1} className="text-right font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(data.total)}</TableCell>
                      </TableRow>
                    ) : null}
                  </ReportFooter>
              )}
            </Table>
          </div>
        </div>
        <DialogFooter className="pt-4 mt-auto no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
