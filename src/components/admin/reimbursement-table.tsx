
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Reimbursement, ReimbursementStatus, User } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { DataTableColumnHeader } from "../ui/data-table-column-header";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { HandCoins, CheckCircle2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";

type ReimbursementTableProps = {
  data: Reimbursement[];
  users: User[];
  isLoading: boolean;
  onLiquidate: (reimbursement: Reimbursement) => void;
  onEdit: (reimbursement: Reimbursement) => void;
  onDelete: (reimbursement: Reimbursement) => void;
};

const statusConfig: Record<ReimbursementStatus, { variant: "secondary" | "default", icon: React.ElementType, className: string }> = {
  Pending: { variant: 'secondary', icon: HandCoins, className: 'bg-amber-100 text-amber-800' },
  Liquidated: { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
};

export function ReimbursementTable({ data, users, isLoading, onLiquidate, onEdit, onDelete }: ReimbursementTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dateIncurred", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"All" | ReimbursementStatus>("All");

  const columns: ColumnDef<Reimbursement>[] = React.useMemo(() => [
    {
      accessorKey: "dateIncurred",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => <span>{format(parseISO(row.getValue("dateIncurred")), "PP")}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="capitalize">{row.getValue("category")}</span>,
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => <div className="min-w-[300px] whitespace-normal break-words">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "creditedTo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Credit To" />,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as ReimbursementStatus;
        const config = statusConfig[status];
        if (!config) return <Badge variant="outline">{status}</Badge>;
        const StatusIcon = config.icon;
        return (
          <Badge variant={config.variant as any} className={config.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reimbursement = row.original;
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
                    {reimbursement.status === "Pending" && (
                        <DropdownMenuItem onClick={() => onEdit(reimbursement)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                    )}
                    {reimbursement.status === "Pending" ? (
                        <DropdownMenuItem onClick={() => onLiquidate(reimbursement)}>
                            <HandCoins className="mr-2 h-4 w-4" />
                            Liquidate
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem disabled>
                            Already Liquidated
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => onDelete(reimbursement)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onLiquidate, onEdit, onDelete]);

  const filteredData = React.useMemo(() => {
    return statusFilter === "All" ? data : data.filter(d => d.status === statusFilter);
  }, [data, statusFilter]);

  const table = useReactTable({
    data: filteredData,
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
    getPaginationRowModel: getPaginationRowModel(),
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
      <div className="flex flex-col sm:flex-row items-center py-4 gap-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | ReimbursementStatus)}>
            <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Liquidated">Liquidated</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
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
