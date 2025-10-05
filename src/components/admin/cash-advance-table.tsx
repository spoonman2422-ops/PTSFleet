
"use client";

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { DataTableColumnHeader } from '../ui/data-table-column-header';
import type { CashAdvance, User } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type CashAdvanceTableProps = {
  data: CashAdvance[];
  users: User[];
  isLoading: boolean;
};

export function CashAdvanceTable({ data, users, isLoading }: CashAdvanceTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'date', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<CashAdvance>[] = React.useMemo(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span>{format(parseISO(row.getValue('date')), 'PP')}</span>,
      },
      {
        accessorKey: 'driverId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Driver" />,
        cell: ({ row }) => {
          const driverId = row.getValue('driverId') as string;
          const driver = users.find((u) => u.id === driverId);
          return <span className="font-medium">{driver?.name || 'Unknown'}</span>;
        },
        accessorFn: (row) => {
            const driver = users.find(u => u.id === row.driverId);
            return driver?.name || '';
        },
        filterFn: 'includesString'
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount'));
          const formatted = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
          }).format(amount);
          return <div className="text-right font-medium">{formatted}</div>;
        },
      }
    ],
    [users]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
        pagination: {
            pageSize: 5,
        }
    }
  });

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    )
  }

  return (
    <div>
        <div className="py-4">
            <Input
              placeholder="Filter by driver name..."
              value={(table.getColumn('driverId')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('driverId')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                    No cash advances found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Next
            </Button>
      </div>
    </div>
  );
}
