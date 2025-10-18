
"use client";

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState
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
import type { RevolvingFundContribution, User } from '@/lib/types';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Edit, MoreHorizontal } from 'lucide-react';

type RevolvingFundTableProps = {
  data: RevolvingFundContribution[];
  users: User[];
  isLoading: boolean;
  onEdit: (contribution: RevolvingFundContribution) => void;
};

export function RevolvingFundTable({ data, users, isLoading, onEdit }: RevolvingFundTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns: ColumnDef<RevolvingFundContribution>[] = React.useMemo(
    () => [
      {
        accessorKey: 'contributionDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span>{format(parseISO(row.getValue('contributionDate')), 'PP')}</span>,
      },
      {
        accessorKey: 'contributorName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contributor" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue('contributorName')}</span>,
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
      },
      {
        id: 'addedByName',
        accessorFn: (row) => users?.find(u => u.id === row.addedBy)?.name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Logged By" />,
        cell: ({ row }) => {
            const userName = row.getValue("addedByName") as string;
            return (isLoading || !userName) ? <Skeleton className="h-5 w-24" /> : <span>{userName}</span>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const contribution = row.original;
          return (
            <div className="text-right">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contribution)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [users, isLoading, onEdit]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div>
        <div className="flex items-center py-4">
            <Input
            placeholder="Search contributions..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
            />
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                        {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                    ))}
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
                    No contributions found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
    </div>
  );
}
