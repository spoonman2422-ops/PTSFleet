
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Expense, User } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { DataTableColumnHeader } from "../ui/data-table-column-header"
import { Skeleton } from "../ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash2, Download } from "lucide-react"
import { Separator } from "../ui/separator"

type ExpenseTableProps = {
    data: Expense[];
    users: User[];
    isLoading: boolean;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    onDownload: (table: any) => void;
}

export function ExpenseTable({ data, users, isLoading, onEdit, onDelete, onDownload }: ExpenseTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
      { id: "dateIncurred", desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns: ColumnDef<Expense>[] = React.useMemo(() => [
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
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount)

        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
        accessorKey: "paidBy",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Paid By" />,
        cell: ({ row }) => <span className="capitalize">{row.getValue("paidBy")}</span>,
    },
    {
      id: "addedByName",
      accessorFn: (row) => users?.find(u => u.id === row.addedBy)?.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Added By" />,
      cell: ({ row }) => {
        const userName = row.getValue("addedByName") as string;
        return (isLoading || !userName) ? <Skeleton className="h-5 w-24" /> : <span>{userName}</span>;
      },
    },
     {
      id: "actions",
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(expense)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [users, onEdit, onDelete, isLoading]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
  })

  const totalExpenses = React.useMemo(() => {
    return table.getFilteredRowModel().rows.reduce((total, row) => {
        return total + (row.original.amount || 0);
    }, 0);
  }, [table.getFilteredRowModel().rows]);


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
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(event) =>
            setGlobalFilter(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => onDownload(table)}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
        </Button>
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} row(s).
        </div>
      </div>
       <Separator className="my-4" />
        <div className="flex justify-end text-right">
            <div>
                <p className="text-muted-foreground">Total Expenses (Filtered)</p>
                <p className="font-bold text-xl">
                    {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                    }).format(totalExpenses)}
                </p>
            </div>
        </div>
    </div>
  )
}
