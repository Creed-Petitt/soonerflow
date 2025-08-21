"use client"

import { useEffect, useId, useRef, useState, useMemo, useCallback, memo } from "react"
import { useSession } from "next-auth/react"
import useFlowchartStore from "@/stores/useFlowchartStore"
import { Node } from '@xyflow/react'
import { CourseNodeData } from '@/components/prerequisite-flow/course-node'
import { useSchedule } from "@/hooks/use-schedule"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
import { fetchWithAuth } from "@/lib/api-client"
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
    header: "Course Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <div className="font-medium text-xs">{row.getValue("code")}</div>
    ),
    size: 120,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Course Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="text-xs">{row.getValue("name")}</div>
    ),
    size: 350,
  },
  {
    header: "Credits",
    accessorKey: "credits",
    cell: ({ row }) => (
      <div className="text-center text-xs">{row.getValue("credits")}</div>
    ),
    size: 80,
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
        <Badge
          variant="outline"
          className={cn("text-xs", getGlowStyle())}
        >
          {status}
        </Badge>
      )
    },
    size: 100,
    filterFn: statusFilterFn,
  },
  {
    id: "actions",
    header: "Add",
    cell: ({ row, table }) => {
      const { handleAddToSchedule } = (table.options.meta as any) || {};
      
      return (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => handleAddToSchedule(row.original)}
          title="Add to Schedule"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      );
      
      /* Old dropdown code - replaced with multi-select
      return (
        <>
          
          Class Detail Dialog - the exact modal from calendar
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
      */
    },
    size: 60,
    enableHiding: false,
  },
]

// Generate semester options from 2020 to current year + 1, including summer
const generateSemesterOptions = () => {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  
  // Generate from current year + 1 down to 2020
  for (let year = currentYear + 1; year >= 2020; year--) {
    options.push(`Fall ${year}`);
    options.push(`Summer ${year}`);
    options.push(`Spring ${year}`);
  }
  
  return options;
};

const semesterOptions = generateSemesterOptions();

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

const DegreeRequirementsTable = memo(function DegreeRequirementsTable() {
  const id = useId()
  const { data: session } = useSession()
  
  // Flowchart store hooks
  const addNode = useFlowchartStore((state) => state.addNode);
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 9,
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
  const [tempSemester, setTempSemester] = useState("Fall 2024")
  const [courseGrades, setCourseGrades] = useState<{ [key: string]: { grade: string, semester: string } }>({})
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [classDataForModal, setClassDataForModal] = useState<any>(null)
  const [showClassModal, setShowClassModal] = useState(false)
  const [showMultiClassModal, setShowMultiClassModal] = useState(false)
  const [multiSelectRows, setMultiSelectRows] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  
  // State for completed and scheduled courses (replacing store)
  const [completedCourses, setCompletedCourses] = useState<Map<string, any>>(new Map())
  const [scheduledCourses, setScheduledCourses] = useState<Map<string, any>>(new Map())
  const [loadingCourses, setLoadingCourses] = useState(true)
  
  // Get scheduled classes directly from the schedule hook - this is the source of truth
  const { scheduledClasses: persistedScheduledClasses, loading: scheduleLoading, addClass } = useSchedule()
  
  // Load completed courses function
  const loadCompletedCourses = useCallback(async (email: string) => {
    try {
      const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        const coursesMap = new Map()
        data.completedCourses.forEach((course: any) => {
          coursesMap.set(course.course_code, {
            id: course.course_code,
            code: course.course_code,
            grade: course.grade,
            semester: course.semester
          })
        })
        setCompletedCourses(coursesMap)
      }
    } catch (error) {
      console.error('Error loading completed courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  const statusOptions = ["Completed", "In Progress", "Not Started"]

  // Handle adding a single course to schedule
  const handleAddToSchedule = async (course: any) => {
    try {
      // Validate course data
      if (!course || !course.code) {
        console.error('Invalid course data:', course);
        return;
      }
      
      const codeParts = course.code.split(' ');
      if (codeParts.length < 2) {
        console.error('Invalid course code format:', course.code);
        return;
      }
      
      // Clear any existing modal data and show loading state
      setClassDataForModal(null);
      setModalLoading(true);
      setShowClassModal(true);
      
      
      // Fetch class data - using search parameter to get all classes
      const response = await fetch(`/api/classes?subject=${codeParts[0]}&search=${codeParts[1]}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        const allClasses = data.classes || [];
        
        // IMPORTANT: Filter to only get the exact course we want
        const classes = allClasses.filter((c: any) => 
          c.subject === codeParts[0] && c.number === codeParts[1]
        );
        
        
        if (classes.length > 0) {
          // Group sections by course
          const groupedClass = {
            subject: codeParts[0],
            number: codeParts[1],
            title: classes[0].title || course.name,
            credits: classes[0].credits || course.credits,
            sections: classes.filter((c: any) => c.type !== 'Lab with No Credit'),
            labSections: classes.filter((c: any) => c.type === 'Lab with No Credit')
          };
          
          setClassDataForModal({
            groupedClass,
            selectedSection: classes[0]
          });
          setModalLoading(false);
        } else {
          setShowClassModal(false);
          setModalLoading(false);
        }
      } else {
        console.error('Failed to fetch classes:', response.status);
        setShowClassModal(false);
        setModalLoading(false);
      }
    } catch (error) {
      console.error('Error in handleAddToSchedule:', error);
      setShowClassModal(false);
      setModalLoading(false);
    }
  }

  // Fetch major data once when session is available (FIXED - proper caching)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  
  useEffect(() => {
    // Only load data once per session
    if (hasLoadedData || !session?.user?.githubId) {
      if (!hasLoadedData) {
        setData(sampleData)
        setLoading(false)
      }
      return
    }
    
    const fetchMajorData = async () => {
      // Only fetch if we have a session with a GitHub ID
      if (!session?.user?.githubId) {
        return
      }

      setLoading(true)

      try {
        // Step 1: Fetch user data from backend
        const userResponse = await fetchWithAuth(`/api/users/${session.user.githubId}`)
        if (!userResponse.ok) {
          console.error("Failed to fetch user data")
          return
        }
        const userData = await userResponse.json()

        if (!userData.major) {
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

        setData(transformedCourses)
        setHasLoadedData(true)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching major data:", error)
        setData(sampleData)
        setLoading(false)
      }
    }

    fetchMajorData()
  }, [session?.user?.githubId, hasLoadedData]) // Only run when needed

  // Load completed courses once when session is available (FIXED - no loops)
  const [hasLoadedCompletedCourses, setHasLoadedCompletedCourses] = useState(false)
  
  useEffect(() => {
    if (!session?.user?.email || hasLoadedCompletedCourses) return;
    
    // Load completed courses immediately (no delay)
    setHasLoadedCompletedCourses(true)
    loadCompletedCourses(session.user.email)
  }, [session?.user?.email, hasLoadedCompletedCourses, loadCompletedCourses])

  // Memoize scheduled class codes to prevent unnecessary re-renders
  const scheduledClassCodes = useMemo(() => {
    if (!persistedScheduledClasses) return new Set<string>()
    return new Set(persistedScheduledClasses.map((cls: any) => {
      const classCode = `${cls.subject} ${cls.number || cls.courseNumber || ''}`
      return classCode.trim()
    }))
  }, [persistedScheduledClasses])

  // Update course statuses when scheduled/completed courses change (FIXED - no more loops)
  const updateCourseStatuses = useCallback(() => {
    if (data.length === 0) return

    setData(prevData => {
      let hasChanges = false
      const updatedData = prevData.map(course => {
        const isScheduled = scheduledClassCodes.has(course.code)
        
        // Check if course is completed - handle different formats
        const isCompleted = completedCourses.has(course.code) || 
                           completedCourses.has(course.code.replace(' ', '')) || 
                           completedCourses.has(course.code.replace(' ', ' ')) // Handle multiple spaces
        
        const newStatus = isCompleted ? "Completed" : 
                         isScheduled ? "In Progress" : 
                         "Not Started"
        
        if (course.status !== newStatus) {
          hasChanges = true
          // If marking as completed, check if we have grade info
          const completedCourse = Array.from(completedCourses.values()).find(
            c => c.code === course.code || c.code === course.code.replace(' ', '')
          )
          return { 
            ...course, 
            status: newStatus,
            grade: completedCourse?.grade || course.grade,
            semester: completedCourse?.semester || course.semester
          }
        }
        return course
      })
      
      // Only return new array if there were actual changes
      return hasChanges ? updatedData : prevData
    })
  }, [data.length, scheduledClassCodes, completedCourses])

  // Trigger status update when dependencies change
  useEffect(() => {
    // Only update statuses after we have data
    if (data.length > 0) {
      updateCourseStatuses()
    }
  }, [data.length, scheduledClassCodes, completedCourses, updateCourseStatuses])
  
  // Listen for course removal events
  useEffect(() => {
    const handleCourseRemoved = () => {
      if (session?.user?.email) {
        loadCompletedCourses(session.user.email)
      }
    }
    
    window.addEventListener('courseRemoved', handleCourseRemoved)
    
    return () => {
      window.removeEventListener('courseRemoved', handleCourseRemoved)
    }
  }, [session?.user?.email, loadCompletedCourses])

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
    meta: {
      addClass, // Pass addClass function through table meta
      handleAddToSchedule,
      showClassModal,
      setShowClassModal,
      classDataForModal,
      setClassDataForModal,
      showMultiClassModal,
      setShowMultiClassModal,
      multiSelectRows,
      setMultiSelectRows,
      modalLoading,
    },
  })

  const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-2" style={{ width: '750px' }}>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search courses..."
            value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("code")?.setFilterValue(event.target.value)
            }
            className="w-[180px] h-8"
          />
        </div>

        <div className="flex items-center gap-2">
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

          {/* Removed Category Filter since we removed the category column */}
        </div>
      </div>

      <div className="overflow-auto rounded-md border relative" style={{ width: '750px', height: '340px' }}>
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading your degree requirements...</span>
            </div>
          </div>
        )}
        <Table className="text-xs table-fixed" style={{ width: '100%' }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="text-xs h-7"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-1"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUpIcon className="h-3 w-3" />,
                          desc: <ChevronDownIcon className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
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
                  className="h-[31px] hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1 px-2 text-xs">
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

      {/* Class Detail Modal */}
      {showClassModal && (
        <>
          {modalLoading ? (
            // Show loading spinner while fetching
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-background p-8 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Loading class information...</span>
                </div>
              </div>
            </div>
          ) : classDataForModal ? (
            <ClassDetailDialog
              isOpen={showClassModal}
              onClose={() => {
                setShowClassModal(false);
                setClassDataForModal(null);
              }}
              groupedClass={classDataForModal.groupedClass}
              selectedSection={classDataForModal.selectedSection}
              onAddToSchedule={(section) => {
                const selectedSection = section || classDataForModal.selectedSection;
                
                // Generate a random color for the class
                const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Add to schedule using the hook
                addClass({
                  id: selectedSection.id,
                  subject: selectedSection.subject,
                  number: selectedSection.number || selectedSection.courseNumber || '',
                  title: selectedSection.title,
                  instructor: selectedSection.instructor || 'TBA',
                  time: selectedSection.time || 'TBA',
                  location: selectedSection.location || 'TBA',
                  credits: selectedSection.credits || 3,
                  type: selectedSection.type,
                  color: randomColor,
                  available_seats: selectedSection.availableSeats,
                  total_seats: selectedSection.totalSeats,
                  rating: selectedSection.rating,
                  difficulty: selectedSection.difficulty,
                  wouldTakeAgain: selectedSection.wouldTakeAgain
                });
                
                // Close the modal
                setShowClassModal(false);
                setClassDataForModal(null);
                
                // Dispatch custom event to notify dashboard
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('courseAddedToSchedule'));
                }
              }}
            />
          ) : null}
        </>
      )}

      {/* Multi-Class Selection Modal */}
      {showMultiClassModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setShowMultiClassModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-background border rounded-lg shadow-xl z-50">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Add Multiple Courses to Schedule</h3>
                <button
                  onClick={() => setShowMultiClassModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  You've selected {multiSelectRows.length} courses. This feature will be available soon - 
                  for now, please add courses to your schedule one at a time.
                </p>
                
                <div className="space-y-2">
                  {multiSelectRows.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-mono text-sm font-medium">{course.code}</span>
                        <span className="text-sm text-muted-foreground ml-2">{course.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{course.credits} credits</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t">
                <button
                  onClick={() => setShowMultiClassModal(false)}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default DegreeRequirementsTable

