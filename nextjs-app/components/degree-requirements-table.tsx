"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  Columns3Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Course = {
  id: string
  code: string
  name: string
  credits: number
  category: "Major" | "Gen Ed" | "Elective"
  status: "Completed" | "In Progress" | "Not Started"
  prerequisite: string
  semester?: string
}

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Course> = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.code} ${row.original.name}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableRowContent.includes(searchTerm)
}

const statusFilterFn: FilterFn<Course> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true
  const status = row.getValue(columnId) as string
  return filterValue.includes(status)
}

const categoryFilterFn: FilterFn<Course> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true
  const category = row.getValue(columnId) as string
  return filterValue.includes(category)
}

const columns: ColumnDef<Course>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Course Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <div className="font-medium text-xs">{row.getValue("code")}</div>
    ),
    size: 100,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Course Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="text-xs">{row.getValue("name")}</div>
    ),
    size: 220,
  },
  {
    header: "Credits",
    accessorKey: "credits",
    cell: ({ row }) => (
      <div className="text-center text-xs">{row.getValue("credits")}</div>
    ),
    size: 60,
  },
  {
    header: "Category",
    accessorKey: "category",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("category")}
      </Badge>
    ),
    size: 100,
    filterFn: categoryFilterFn,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant="outline"
          className="text-xs"
        >
          {status}
        </Badge>
      )
    },
    size: 120,
    filterFn: statusFilterFn,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs">
            <PlusIcon className="h-3 w-3 mr-1" />
            Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Add to...</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Current Schedule</DropdownMenuItem>
          <DropdownMenuItem>Spring 2025</DropdownMenuItem>
          <DropdownMenuItem>Fall 2025</DropdownMenuItem>
          <DropdownMenuItem>Flowchart</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 100,
    enableHiding: false,
  },
]

// Sample data for demonstration
const sampleData: Course[] = [
  {
    id: "1",
    code: "ECE 2214",
    name: "Digital Design",
    credits: 4,
    category: "Major",
    status: "Completed",
    prerequisite: "",
    semester: "Fall 2024",
  },
  {
    id: "2",
    code: "ECE 3723",
    name: "Electrical Circuits II",
    credits: 3,
    category: "Major",
    status: "In Progress",
    prerequisite: "ECE 2723",
    semester: "Spring 2025",
  },
  {
    id: "3",
    code: "MATH 3333",
    name: "Linear Algebra",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "MATH 2924",
  },
  {
    id: "4",
    code: "PSC 1113",
    name: "American Federal Government",
    credits: 3,
    category: "Gen Ed",
    status: "Not Started",
    prerequisite: "",
  },
  {
    id: "5",
    code: "ECE 3793",
    name: "Signals and Systems",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "ECE 2713, MATH 3113",
  },
  {
    id: "6",
    code: "ENGR 2002",
    name: "Professional Skills",
    credits: 2,
    category: "Major",
    status: "Not Started",
    prerequisite: "Sophomore standing",
  },
  {
    id: "7",
    code: "CS 2813",
    name: "Discrete Structures",
    credits: 3,
    category: "Elective",
    status: "Not Started",
    prerequisite: "MATH 1914",
  },
  {
    id: "8",
    code: "HIST 1483",
    name: "US History to 1865",
    credits: 3,
    category: "Gen Ed",
    status: "Completed",
    prerequisite: "",
  },
  {
    id: "9",
    code: "PHYS 2514",
    name: "Physics for Engineers I",
    credits: 4,
    category: "Major",
    status: "Not Started",
    prerequisite: "MATH 2924",
  },
  {
    id: "10",
    code: "ECE 3613",
    name: "Electromagnetic Fields I",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "PHYS 2524",
  },
  {
    id: "11",
    code: "ECE 4273",
    name: "Digital Signal Processing",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "ECE 3793",
  },
  {
    id: "12",
    code: "ENGL 3153",
    name: "Technical Writing",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "ENGL 1213",
  },
  {
    id: "13",
    code: "ECE 4743",
    name: "Computer Architecture",
    credits: 3,
    category: "Major",
    status: "Not Started",
    prerequisite: "ECE 3723",
  },
  {
    id: "14",
    code: "MATH 4163",
    name: "Partial Differential Equations",
    credits: 3,
    category: "Elective",
    status: "Not Started",
    prerequisite: "MATH 3113",
  },
]

export default function DegreeRequirementsTable() {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "code",
      desc: false,
    },
  ])
  const [data, setData] = useState<Course[]>(sampleData)

  const statusOptions = ["Completed", "In Progress", "Not Started"]
  const categoryOptions = ["Major", "Gen Ed", "Elective"]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined
  const categoryFilter = table.getColumn("category")?.getFilterValue() as string[] | undefined

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search courses..."
            value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("code")?.setFilterValue(event.target.value)
            }
            className="w-[180px] h-8"
          />
          
          {/* Pagination controls moved here */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2 text-xs"
            >
              Prev
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2 text-xs"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter moved to right */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                <ListFilterIcon className="h-3 w-3" />
                Status
                {statusFilter?.length ? (
                  <Badge variant="secondary" className="ml-1 px-1 text-xs">
                    {statusFilter.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="p-1">
                {statusOptions.map((status) => (
                  <div key={status} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={statusFilter?.includes(status) ?? false}
                      onCheckedChange={(checked) => {
                        const currentFilter = statusFilter || []
                        const newFilter = checked
                          ? [...currentFilter, status]
                          : currentFilter.filter((s) => s !== status)
                        table.getColumn("status")?.setFilterValue(
                          newFilter.length ? newFilter : undefined
                        )
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Category Filter moved to right */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                <FilterIcon className="h-3 w-3" />
                Category
                {categoryFilter?.length ? (
                  <Badge variant="secondary" className="ml-1 px-1 text-xs">
                    {categoryFilter.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="p-1">
                {categoryOptions.map((category) => (
                  <div key={category} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={categoryFilter?.includes(category) ?? false}
                      onCheckedChange={(checked) => {
                        const currentFilter = categoryFilter || []
                        const newFilter = checked
                          ? [...currentFilter, category]
                          : currentFilter.filter((c) => c !== category)
                        table.getColumn("category")?.setFilterValue(
                          newFilter.length ? newFilter : undefined
                        )
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Column Visibility */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
              <Columns3Icon className="h-3 w-3" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border">
        <Table className="text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs h-8"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-[35px]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-0">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}