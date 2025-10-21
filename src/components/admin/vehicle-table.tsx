
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
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { DataTableColumnHeader } from "../ui/data-table-column-header";
import { Skeleton } from "../ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2, Truck, Wrench, CircleOff } from "lucide-react";
import { Badge } from "../ui/badge";

type VehicleTableProps = {
  data: Vehicle[];
  isLoading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
};

const statusConfig: Record<VehicleStatus, { variant: "secondary" | "default" | "destructive", icon: React.ElementType, className: string }> = {
  Active: { variant: 'default', icon: Truck, className: 'bg-green-100 text-green-800' },
  'Under Maintenance': { variant: 'secondary', icon: Wrench, className: 'bg-amber-100 text-amber-800' },
  Decommissioned: { variant: 'destructive', icon: CircleOff, className: 'bg-red-100 text-red-800' },
};

export function VehicleTable({ data, isLoading, onEdit, onDelete }: VehicleTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dateAcquired", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<Vehicle>[] = React.useMemo(() => [
    {
      accessorKey: "make",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Make & Model" />,
      cell: ({ row }) => (
        <div>
          <div className="font-bold">{row.original.make}</div>
          <div className="text-sm text-muted-foreground">{row.original.model} ({row.original.year})</div>
        </div>
      ),
    },
    {
      accessorKey: "plateNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Plate Number" />,
    },
    {
      accessorKey: "ownerName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    },
    {
      accessorKey: "dateAcquired",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Acquired" />,
      cell: ({ row }) => <span>{format(parseISO(row.getValue("dateAcquired")), "PP")}</span>,
    },
     {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as VehicleStatus;
        const config = statusConfig[status];
        if (!config) return <Badge variant="outline">{status}</Badge>;
        const StatusIcon = config.icon;
        return (
          <Badge variant={config.variant} className={config.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const vehicle = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(vehicle)}
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
  ], [onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
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
          placeholder="Search vehicles..."
          value={globalFilter ?? ''}
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No vehicles found.
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
