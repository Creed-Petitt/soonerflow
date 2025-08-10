"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import useCourseStore from "@/stores/useCourseStore"
import { useSchedule } from "@/hooks/use-schedule"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
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
  CheckIcon,
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
  category: "Major" | "Gen Ed" | "Elective" | "Program Requirements" | "Degree Requirements"
  status: "Completed" | "In Progress" | "Not Started"
  prerequisite: string
  semester?: string
  grade?: string
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
      const grade = row.original.grade
      
      // Simple glow based on status
      const getGlowStyle = () => {
        switch (status) {
          case "Completed":
            return "shadow-[0_0_4px_rgba(34,197,94,0.6)]"
          case "In Progress":
            return "shadow-[0_0_4px_rgba(59,130,246,0.6)]"
          case "Not Started":
            return "shadow-[0_0_4px_rgba(156,163,175,0.3)]"
          default:
            return ""
        }
      }
      
      return (
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn("text-xs", getGlowStyle())}
          >
            {status}
          </Badge>
          {grade && status === "Completed" && (
            <Badge variant="secondary" className="text-xs">
              {grade}
            </Badge>
          )}
        </div>
      )
    },
    size: 140,
    filterFn: statusFilterFn,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const addToFlowChart = useCourseStore((state) => state.addToFlowChart);
      const addToSchedule = useCourseStore((state) => state.addToSchedule);
      const { addClass } = useSchedule();
      const [showClassModal, setShowClassModal] = useState(false);
      const [classDataForModal, setClassDataForModal] = useState<any>(null);
      const buttonRef = useRef<HTMLButtonElement>(null);
      
      // Load class sections when modal is requested
      useEffect(() => {
        if (showClassModal && row.original) {
          const loadClassData = async () => {
            try {
              const [subject, number] = row.original.code.split(' ');
              const response = await fetch(`/api/classes?subject=${subject}&limit=500`);
              if (response.ok) {
                const data = await response.json();
                const sections = (data.classes || []).filter((s: any) => 
                  s.subject === subject && s.number === number && s.type !== 'Lab with No Credit'
                );
                const labSections = (data.classes || []).filter((s: any) => 
                  s.subject === subject && s.number === number && s.type === 'Lab with No Credit'
                );
                
                setClassDataForModal({
                  groupedClass: {
                    subject,
                    number,
                    title: row.original.name,
                    credits: row.original.credits,
                    sections: sections.length > 0 ? sections : [{
                      id: row.original.id,
                      subject,
                      number: number,
                      courseNumber: number,
                      title: row.original.name,
                      instructor: 'TBA',
                      time: 'TBA',
                      location: 'TBA',
                      credits: row.original.credits,
                    }],
                    labSections
                  },
                  selectedSection: sections[0] || {
                    id: row.original.id,
                    subject,
                    number: number,
                    courseNumber: number,
                    title: row.original.name,
                    instructor: 'TBA',
                    time: 'TBA',
                    location: 'TBA',
                    credits: row.original.credits,
                  }
                });
              }
            } catch (error) {
              console.error('Error loading class data:', error);
            }
          };
          loadClassData();
        }
      }, [showClassModal, row.original]);
      
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={buttonRef} variant="ghost" size="sm" className="text-xs">
                <PlusIcon className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Add to...</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  setShowClassModal(true);
                }}
              >
                Current Schedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToFlowChart(row.original)}>
                Prerequisite Flowchart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Class Detail Dialog - the exact modal from calendar */}
          {classDataForModal && (
            <ClassDetailDialog
              isOpen={showClassModal}
              onClose={() => {
                setShowClassModal(false);
                setClassDataForModal(null);
                // Restore focus to the button that opened the modal
                setTimeout(() => {
                  buttonRef.current?.focus();
                }, 100);
              }}
              groupedClass={classDataForModal.groupedClass}
              selectedSection={classDataForModal.selectedSection}
              onAddToSchedule={(section) => {
                // Generate a color for the calendar event
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Add to schedule hook for persistence
                addClass({
                  id: section.id,
                  subject: section.subject,
                  number: section.number || section.courseNumber || '',
                  title: section.title,
                  instructor: section.instructor || 'TBA',
                  time: section.time || 'TBA',
                  location: section.location || 'TBA',
                  credits: section.credits || 3,
                  type: section.type,
                  color: randomColor,
                  available_seats: section.availableSeats,
                  total_seats: section.totalSeats,
                  rating: section.rating,
                  difficulty: section.difficulty,
                  wouldTakeAgain: section.wouldTakeAgain
                });
                
                // Also add to Zustand store for status tracking
                addToSchedule({
                  id: section.id,
                  code: `${section.subject} ${section.number || section.courseNumber || ''}`,
                  name: section.title,
                  credits: section.credits || 3,
                  section: section.id,
                  time: section.time || 'TBA',
                  location: section.location || 'TBA',
                  instructor: section.instructor || 'TBA'
                }, 'Spring 2025');
                
                setShowClassModal(false);
                setClassDataForModal(null);
                // Restore focus after successfully adding
                setTimeout(() => {
                  buttonRef.current?.focus();
                }, 100);
              }}
            />
          )}
        </>
      );
    },
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
    grade: "A-",
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
    grade: "B+",
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
  const { data: session } = useSession()
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
  const [data, setData] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [gradeInputOpen, setGradeInputOpen] = useState(false)
  const [tempGrade, setTempGrade] = useState("A")
  const [courseGrades, setCourseGrades] = useState<{ [key: string]: { grade: string, semester: string } }>({})
  const [bulkEditMode, setBulkEditMode] = useState(false)
  
  // Get store functions
  const markMultipleComplete = useCourseStore((state) => state.markMultipleComplete)
  const completedCourses = useCourseStore((state) => state.completedCourses)
  const getCourseStatus = useCourseStore((state) => state.getCourseStatus)
  const scheduledCourses = useCourseStore((state) => state.scheduledCourses)
  
  // Get scheduled classes directly from the schedule hook - this is the source of truth
  const { scheduledClasses: persistedScheduledClasses, loading: scheduleLoading } = useSchedule()

  const statusOptions = ["Completed", "In Progress", "Not Started"]
  const categoryOptions = ["Major", "Gen Ed", "Elective", "Program Requirements", "Degree Requirements"]

  // Fetch real major data when session is available
  useEffect(() => {
    const fetchMajorData = async () => {
      // Only fetch if we have a session with a GitHub ID
      if (!session?.user?.githubId) {
        console.log("No session or GitHub ID available")
        return
      }

      setLoading(true)
      console.log("Fetching data for GitHub ID:", session.user.githubId)

      try {
        // Step 1: Fetch user data from backend
        const userResponse = await fetch(`/api/users/${session.user.githubId}`)
        if (!userResponse.ok) {
          console.error("Failed to fetch user data")
          return
        }
        const userData = await userResponse.json()
        console.log("User data:", userData)

        if (!userData.major) {
          console.log("User has no major selected")
          setLoading(false)
          return
        }

        // Step 2: Fetch major courses from backend
        const majorCoursesResponse = await fetch(`/api/major-courses?major_name=${encodeURIComponent(userData.major)}`)
        if (!majorCoursesResponse.ok) {
          console.error("Failed to fetch major courses")
          setLoading(false)
          return
        }
        const majorCourses = await majorCoursesResponse.json()
        console.log(`Fetched ${majorCourses.length} courses for ${userData.major}`)

        // Step 3: Deduplicate courses (same course might appear in multiple requirement categories)
        const courseMap = new Map<string, any>()
        majorCourses.forEach((course: any) => {
          const key = `${course.subject}-${course.courseNumber}`
          // Keep the first occurrence or prefer "Program Requirements" over "Degree Requirements"
          if (!courseMap.has(key) || course.category === "Program Requirements") {
            courseMap.set(key, course)
          }
        })
        const uniqueCourses = Array.from(courseMap.values())
        console.log(`Deduplicated to ${uniqueCourses.length} unique courses`)

        // Step 4: Filter out honors courses and specific unwanted courses
        const filteredCourses = uniqueCourses.filter((course: any) => {
          // Filter out honors courses (typically have odd course numbers like 1335, 1395, etc.)
          if (course.subject === "CHEM" && course.courseNumber === "1335") return false;
          if (course.subject === "PHYS" && course.courseNumber === "1434") return false;
          // Add more filters as needed
          return true;
        });

        // Step 5: Transform data to match our table format with smart categorization
        const transformedCourses: Course[] = filteredCourses.map((course: any) => {
          // Smart categorization based on course subject and number
          let category: Course["category"] = "Degree Requirements"
          
          // Electives (CS 3000/4000 level courses that are electives)
          if ((course.subject === "CS" || course.subject === "ECE") && 
              (course.courseNumber === "3000" || course.courseNumber === "4000")) {
            category = "Elective"
          }
          // Program-specific courses (ECE courses, CS required courses)
          else if (course.subject === "ECE" || 
                   (course.subject === "CS" && course.courseNumber !== "3000" && course.courseNumber !== "4000")) {
            category = "Program Requirements"
          }
          // General Education courses
          else if (["EXPO", "ENGL", "PSC", "HIST", "P SC"].includes(course.subject)) {
            category = "Gen Ed"
          }
          // Common engineering/science courses (MATH, PHYS, CHEM, ENGR) are Degree Requirements
          else if (["MATH", "PHYS", "CHEM", "ENGR"].includes(course.subject)) {
            category = "Degree Requirements"
          }
          
          return {
            id: `${course.subject}-${course.courseNumber}`,
            code: `${course.subject} ${course.courseNumber}`,
            name: course.title || `${course.subject} ${course.courseNumber}`,
            credits: course.credits || 3,
            category: category,
            status: "Not Started" as const,
            prerequisite: "",
            semester: undefined,
            grade: undefined
          }
        })

        console.log("Transformed courses:", transformedCourses.slice(0, 5))
        setData(transformedCourses)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching major data:", error)
        setLoading(false)
        // Keep using sample data on error
      }
    }

    fetchMajorData()
  }, [session]) // Only re-run when session changes

  // Update ONLY the status when scheduled classes change
  useEffect(() => {
    if (data.length === 0) return // Don't update if no data yet
    
    setData(prevData => prevData.map(course => {
      // Check if scheduled
      const isScheduled = persistedScheduledClasses && persistedScheduledClasses.some((cls: any) => {
        const classCode = `${cls.subject} ${cls.number || cls.courseNumber || ''}`
        return classCode.trim() === course.code
      })
      
      // Determine status
      const newStatus = completedCourses.has(course.code) ? "Completed" : 
                       isScheduled ? "In Progress" : 
                       "Not Started"
      
      return { ...course, status: newStatus }
    }))
  }, [persistedScheduledClasses, completedCourses, data.length]) // Trigger when data loads or scheduled classes change

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

          {/* Mark as Complete button - only shows when rows are selected */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Popover open={gradeInputOpen} onOpenChange={setGradeInputOpen}>
              <PopoverTrigger asChild>
                <Button 
                  size="sm" 
                  className="gap-1 h-7 text-xs"
                >
                  <CheckIcon className="h-3 w-3" />
                  Mark as Complete ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] p-4" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Mark courses as completed</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {table.getFilteredSelectedRowModel().rows.length > 1 
                        ? "Set individual grades for each course or apply the same grade to all"
                        : "Select the grade received for this course"}
                    </p>
                  </div>
                  
                  {/* Show individual course grade inputs if multiple courses selected */}
                  {table.getFilteredSelectedRowModel().rows.length > 1 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded p-2">
                      {table.getFilteredSelectedRowModel().rows.map((row) => {
                        const courseId = row.original.id
                        const courseGrade = courseGrades[courseId]?.grade || "A"
                        const courseSemester = courseGrades[courseId]?.semester || "Fall 2024"
                        
                        return (
                          <div key={courseId} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {row.original.code} - {row.original.name}
                              </p>
                            </div>
                            <select 
                              value={courseGrade}
                              onChange={(e) => setCourseGrades(prev => ({
                                ...prev,
                                [courseId]: { ...prev[courseId], grade: e.target.value, semester: courseSemester }
                              }))}
                              className="w-[100px] h-7 px-1 border rounded text-xs bg-background text-foreground border-input"
                            >
                              <option value="A">A (4.0)</option>
                              <option value="A-">A- (3.7)</option>
                              <option value="B+">B+ (3.3)</option>
                              <option value="B">B (3.0)</option>
                              <option value="B-">B- (2.7)</option>
                              <option value="C+">C+ (2.3)</option>
                              <option value="C">C (2.0)</option>
                              <option value="C-">C- (1.7)</option>
                              <option value="D+">D+ (1.3)</option>
                              <option value="D">D (1.0)</option>
                              <option value="F">F (0.0)</option>
                            </select>
                            <select 
                              value={courseSemester}
                              onChange={(e) => setCourseGrades(prev => ({
                                ...prev,
                                [courseId]: { ...prev[courseId], grade: courseGrade, semester: e.target.value }
                              }))}
                              className="w-[110px] h-7 px-1 border rounded text-xs bg-background text-foreground border-input"
                            >
                              <option value="Spring 2019">Spring 2019</option>
                              <option value="Fall 2019">Fall 2019</option>
                              <option value="Spring 2020">Spring 2020</option>
                              <option value="Fall 2020">Fall 2020</option>
                              <option value="Spring 2021">Spring 2021</option>
                              <option value="Fall 2021">Fall 2021</option>
                              <option value="Spring 2022">Spring 2022</option>
                              <option value="Fall 2022">Fall 2022</option>
                              <option value="Spring 2023">Spring 2023</option>
                              <option value="Fall 2023">Fall 2023</option>
                              <option value="Spring 2024">Spring 2024</option>
                              <option value="Fall 2024">Fall 2024</option>
                              <option value="Spring 2025">Spring 2025</option>
                              <option value="Fall 2025">Fall 2025</option>
                              <option value="Spring 2026">Spring 2026</option>
                              <option value="Fall 2026">Fall 2026</option>
                              <option value="Spring 2027">Spring 2027</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Apply same grade to all option */}
                  {table.getFilteredSelectedRowModel().rows.length > 1 && (
                    <div className="border-t pt-3">
                      <label className="text-xs font-medium">Or apply same grade to all:</label>
                      <div className="flex gap-2 mt-2">
                        <select 
                          value={tempGrade} 
                          onChange={(e) => setTempGrade(e.target.value)}
                          className="flex-1 h-8 px-2 border rounded text-xs bg-background text-foreground border-input"
                        >
                          <option value="A">A (4.0)</option>
                          <option value="A-">A- (3.7)</option>
                          <option value="B+">B+ (3.3)</option>
                          <option value="B">B (3.0)</option>
                          <option value="B-">B- (2.7)</option>
                          <option value="C+">C+ (2.3)</option>
                          <option value="C">C (2.0)</option>
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedRows = table.getFilteredSelectedRowModel().rows
                            const newGrades: typeof courseGrades = {}
                            selectedRows.forEach(row => {
                              newGrades[row.original.id] = { grade: tempGrade, semester: "Fall 2024" }
                            })
                            setCourseGrades(newGrades)
                          }}
                        >
                          Apply to All
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Single course grade input */}
                  {table.getFilteredSelectedRowModel().rows.length === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">Grade</label>
                        <select 
                          value={tempGrade} 
                          onChange={(e) => setTempGrade(e.target.value)}
                          className="w-full mt-1 h-8 px-2 border rounded text-xs bg-background text-foreground border-input"
                        >
                          <option value="A">A (4.0)</option>
                          <option value="A-">A- (3.7)</option>
                          <option value="B+">B+ (3.3)</option>
                          <option value="B">B (3.0)</option>
                          <option value="B-">B- (2.7)</option>
                          <option value="C+">C+ (2.3)</option>
                          <option value="C">C (2.0)</option>
                          <option value="C-">C- (1.7)</option>
                          <option value="D+">D+ (1.3)</option>
                          <option value="D">D (1.0)</option>
                          <option value="F">F (0.0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Semester</label>
                        <select 
                          className="w-full mt-1 h-8 px-2 border rounded text-xs bg-background text-foreground border-input"
                        >
                          <option value="Fall 2024">Fall 2024</option>
                          <option value="Spring 2024">Spring 2024</option>
                          <option value="Fall 2023">Fall 2023</option>
                          <option value="Spring 2023">Spring 2023</option>
                          <option value="Fall 2022">Fall 2022</option>
                          <option value="Spring 2022">Spring 2022</option>
                          <option value="Fall 2021">Fall 2021</option>
                          <option value="Spring 2021">Spring 2021</option>
                          <option value="Fall 2020">Fall 2020</option>
                          <option value="Spring 2020">Spring 2020</option>
                          <option value="Fall 2019">Fall 2019</option>
                          <option value="Spring 2019">Spring 2019</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        const selectedRows = table.getFilteredSelectedRowModel().rows
                        
                        // Update the data to mark selected courses as completed with grades
                        setData(prevData => 
                          prevData.map(course => {
                            const isSelected = selectedRows.some(row => row.original.id === course.id)
                            if (isSelected) {
                              const gradeInfo = courseGrades[course.id]
                              return { 
                                ...course, 
                                status: "Completed" as const, 
                                grade: gradeInfo?.grade || tempGrade,
                                semester: gradeInfo?.semester || "Fall 2024"
                              }
                            }
                            return course
                          })
                        )
                        
                        // Also update the global store
                        const coursesToComplete = selectedRows.map(row => ({
                          id: row.original.id,
                          grade: courseGrades[row.original.id]?.grade || tempGrade,
                          semester: courseGrades[row.original.id]?.semester || "Fall 2024"
                        }))
                        markMultipleComplete(coursesToComplete)
                        
                        // Clear selection and close popover
                        table.resetRowSelection()
                        setGradeInputOpen(false)
                        setCourseGrades({})
                        setTempGrade("A")
                      }}
                    >
                      Complete Courses
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setGradeInputOpen(false)
                        setCourseGrades({})
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading your degree requirements...</span>
            </div>
          </div>
        )}
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