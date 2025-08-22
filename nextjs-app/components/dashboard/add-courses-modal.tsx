"use client"

import { useState, useEffect, useMemo, useDeferredValue, useRef } from "react"
import { useSession } from "next-auth/react"
import { semesterNameToCode } from "@/utils/semester-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Course {
  id: string
  code: string
  name: string
  credits: number
  category?: string
}

// Add ClassData interface from ClassBrowserPanel
interface ClassData {
  id: string;
  subject: string;
  courseNumber: string;
  number?: string; // API returns "number" not "courseNumber"
  title: string;
  credits: number;
  instructor?: string;
  time?: string;
  meetingTimes?: any[];
  available_seats?: number; // API uses underscore
  total_seats?: number; // API uses underscore
  type?: string;
  labs?: any[];
}

// Add GroupedClass interface from ClassBrowserPanel
interface GroupedClass {
  subject: string;
  number: string;
  title: string;
  credits?: number;
  sections: ClassData[];
  labSections: ClassData[];
}

interface SelectedCourse extends Course {
  grade: string
}

interface AddCoursesModalProps {
  isOpen: boolean
  onClose: () => void
  semester: string
  onSave: (courses: SelectedCourse[]) => void
  existingCourses?: SelectedCourse[]
}

export function AddCoursesModal({ 
  isOpen, 
  onClose, 
  semester,
  onSave,
  existingCourses = []
}: AddCoursesModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedCourses, setSelectedCourses] = useState<Map<string, SelectedCourse>>(new Map())
  const [departmentCourses, setDepartmentCourses] = useState<Course[]>([])
  const [searchResults, setSearchResults] = useState<Course[]>([])
  // Add new state for raw classes and grouped classes
  const [rawClasses, setRawClasses] = useState<ClassData[]>([])
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [coursePage, setCoursePage] = useState(1)
  const [hasMoreCourses, setHasMoreCourses] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCoursesCount, setTotalCoursesCount] = useState(0)
  const [departments, setDepartments] = useState<{code: string, name: string, count: number}[]>([])
  const [departmentCache, setDepartmentCache] = useState<Record<string, {courses: Course[], totalCount: number}>>({})
  const [userMajor, setUserMajor] = useState<string | null>(null)
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set())
  const { data: session } = useSession()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  // Convert semester name to code dynamically
  const currentSemester = semesterNameToCode(semester)

  // Load user's major and completed courses when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          // Fetch user major
          if (!userMajor) {
            const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`)
            if (response.ok) {
              const data = await response.json()
              setUserMajor(data.majorName)
            }
          }
          
          // Fetch completed courses
          const completedResponse = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`)
          if (completedResponse.ok) {
            const dashboardData = await completedResponse.json()
            const completed = new Set<string>()
            
            // Go through all semesters and collect completed courses
            if (dashboardData.semesters) {
              dashboardData.semesters.forEach((sem: any) => {
                if (sem.courses && sem.courses.length > 0) {
                  sem.courses.forEach((course: any) => {
                    // Create course ID format to match our course list
                    if (course.code) {
                      const parts = course.code.trim().split(/\s+/)
                      if (parts.length >= 2) {
                        const subject = parts.slice(0, -1).join(' ')
                        const number = parts[parts.length - 1]
                        const courseId = `${subject}-${number}`
                        completed.add(courseId)
                      }
                    }
                  })
                }
              })
            }
            setCompletedCourses(completed)
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      }
    }
    
    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen, session?.user?.email, userMajor])

  // Set default to major once userMajor is loaded and departments are loaded
  useEffect(() => {
    if (userMajor && departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment("major")
    }
  }, [userMajor, selectedDepartment, departments.length])

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      // Always reset selection first
      setSelectedCourses(new Map())
      
      // Then initialize with existing courses if editing
      if (existingCourses.length > 0) {
        const existingMap = new Map()
        existingCourses.forEach(course => {
          // Create proper ID format to match available courses
          // Parse course code like "C S 2413" to match API format "C S-2413"
          let courseId = course.id
          if (course.code) {
            const parts = course.code.trim().split(/\s+/)
            if (parts.length >= 2) {
              // Join all parts except last with space, then add dash before course number
              const subject = parts.slice(0, -1).join(' ')
              const number = parts[parts.length - 1]
              courseId = `${subject}-${number}`
            } else {
              // Fallback if format is unexpected
              courseId = course.code.replace(/\s+/g, '-')
            }
          }
          
          existingMap.set(courseId, {
            id: courseId,
            code: course.code,
            name: course.name,
            credits: course.credits || 3,
            category: course.code ? course.code.split(' ')[0] : '',
            grade: course.grade
          })
        })
        setSelectedCourses(existingMap)
      }
    } else {
      // Reset when modal closes
      setSelectedCourses(new Map())
      setSearchQuery("")
      setSelectedDepartment("")
      setCoursePage(1)
      setHasMoreCourses(false)
      setTotalCoursesCount(0)
      setIsLoadingMore(false)
    }
  }, [isOpen, existingCourses])

  // Load courses when department changes
  useEffect(() => {
    if (selectedDepartment === "major") {
      loadMajorCourses()
    } else if (selectedDepartment && selectedDepartment !== "all") {
      // Reset pagination when changing departments
      setCoursePage(1)
      setDepartmentCourses([])
      setHasMoreCourses(false)
      setTotalCoursesCount(0)
      loadCoursesForDepartment(selectedDepartment, 1, true)
    }
  }, [selectedDepartment, userMajor])

  // Perform global search when search query changes
  useEffect(() => {
    const searchGlobally = async () => {
      if (deferredSearchQuery.length >= 1) {
        try {
          setSearchLoading(true)
          const response = await fetch(`/api/classes?search=${encodeURIComponent(deferredSearchQuery)}&semester=${currentSemester}&limit=500&skip_ratings=true`)
          const data = await response.json()
          
          if (data.classes && data.classes.length > 0) {
            // Use the same grouping logic for search results
            const grouped: Record<string, GroupedClass> = {}
            data.classes.forEach((cls: any) => {
              // Skip invalid classes
              if (!cls.subject || (!cls.number && !cls.courseNumber)) return
              
              const key = `${cls.subject} ${cls.number || cls.courseNumber}`
              
              if (!grouped[key]) {
                grouped[key] = {
                  subject: cls.subject,
                  number: cls.number || cls.courseNumber,
                  title: cls.title,
                  credits: cls.credits,
                  sections: [],
                  labSections: []
                }
              }
              
              // Separate labs from lectures
              if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
                grouped[key].labSections.push(cls)
              } else {
                grouped[key].sections.push(cls)
              }
            })
            
            // Filter out groups with no sections and convert to Course format
            const groupedArray = Object.values(grouped).filter(g => 
              g.sections.length > 0 || g.labSections.length > 0
            )
            
            const searchCourses: Course[] = groupedArray.map(group => ({
              id: `${group.subject}-${group.number}`,
              code: `${group.subject} ${group.number}`,
              name: group.title,
              credits: group.credits || 3,
              category: group.subject
            }))
            
            setSearchResults(searchCourses)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error('Search failed:', error)
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      } else {
        // Clear search results when query is empty
        setSearchResults([])
        setSearchLoading(false)
      }
    }

    searchGlobally()
  }, [deferredSearchQuery])

  const loadDepartments = async () => {
    try {
      const response = await fetch(`/api/classes/departments?semester=${currentSemester}`)
      const data = await response.json()
      if (data.departments) {
        setDepartments(data.departments)
      }
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const loadMajorCourses = async () => {
    if (!userMajor) {
      setDepartmentCourses([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/major-courses?major_name=${encodeURIComponent(userMajor)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        // For major courses, we can keep the existing logic since they're already unique
        // But we format them consistently
        const uniqueCourses = new Map()
        data.forEach((course: any) => {
          const courseKey = `${course.subject}-${course.courseNumber}`
          if (!uniqueCourses.has(courseKey)) {
            uniqueCourses.set(courseKey, {
              id: courseKey,
              code: `${course.subject} ${course.courseNumber}`,
              name: course.title,
              credits: course.credits || 3,
              category: course.category || course.subject
            })
          }
        })
        
        const courses = Array.from(uniqueCourses.values())
        setDepartmentCourses(courses)
      } else {
        setDepartmentCourses([])
      }
    } catch (error) {
      console.error('Failed to fetch major courses:', error)
      setDepartmentCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadCoursesForDepartment = async (dept: string, page: number = 1, resetCourses: boolean = false) => {
    // Check cache first (only for first page)
    if (page === 1 && departmentCache[dept] && !resetCourses) {
      const cachedClasses = departmentCache[dept].courses
      setRawClasses(cachedClasses as any)
      processClassesToCourses(cachedClasses as any)
      setTotalCoursesCount(departmentCache[dept].totalCount)
      setHasMoreCourses(cachedClasses.length < departmentCache[dept].totalCount)
      return
    }
    
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const response = await fetch(`/api/classes?subject=${dept}&semester=${currentSemester}&limit=100&page=${page}&skip_ratings=true`)
      const data = await response.json()
      
      if (data.classes && data.classes.length > 0) {
        const newClasses = data.classes
        
        if (page === 1 || resetCourses) {
          // First page or reset - replace all classes
          setRawClasses(newClasses)
          processClassesToCourses(newClasses)
          
          // Cache first page data
          if (page === 1) {
            setDepartmentCache(prev => ({ 
              ...prev, 
              [dept]: { 
                courses: newClasses, 
                totalCount: data.pagination?.total || newClasses.length 
              } 
            }))
          }
        } else {
          // Additional pages - append to existing classes
          const allClasses = [...rawClasses, ...newClasses]
          setRawClasses(allClasses)
          processClassesToCourses(allClasses)
        }
        
        // Set pagination info
        setTotalCoursesCount(data.pagination?.total || newClasses.length)
        setHasMoreCourses(data.pagination?.hasNext || false)
        setCoursePage(page)
      } else {
        if (page === 1 || resetCourses) {
          setRawClasses([])
          setDepartmentCourses([])
          setTotalCoursesCount(0)
        }
        setHasMoreCourses(false)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      if (page === 1 || resetCourses) {
        setRawClasses([])
        setDepartmentCourses([])
        setTotalCoursesCount(0)
      }
      setHasMoreCourses(false)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Add the processClassesToCourses function - converts raw classes to grouped courses like ClassBrowserPanel
  const processClassesToCourses = (allClasses: ClassData[]) => {
    // Group classes by subject + number (like ClassBrowserPanel)
    const grouped: Record<string, GroupedClass> = {}
    allClasses.forEach((cls: ClassData) => {
      // Skip invalid classes
      if (!cls.subject || (!cls.number && !cls.courseNumber)) return
      
      const key = `${cls.subject} ${cls.number || cls.courseNumber}`
      
      if (!grouped[key]) {
        grouped[key] = {
          subject: cls.subject,
          number: cls.number || cls.courseNumber,
          title: cls.title,
          credits: cls.credits,
          sections: [],
          labSections: []
        }
      }
      
      // Separate labs from lectures
      if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
        grouped[key].labSections.push(cls)
      } else {
        grouped[key].sections.push(cls)
      }
    })
    
    // Filter out groups with no sections
    const groupedArray = Object.values(grouped).filter(g => 
      g.sections.length > 0 || g.labSections.length > 0
    )
    setGroupedClasses(groupedArray)
    
    // Convert grouped classes to Course format for existing UI
    const courses: Course[] = groupedArray.map(group => ({
      id: `${group.subject}-${group.number}`,
      code: `${group.subject} ${group.number}`,
      name: group.title,
      credits: group.credits || 3,
      category: group.subject
    }))
    
    setDepartmentCourses(courses)
  }

  const loadMoreCourses = async () => {
    if (!selectedDepartment || selectedDepartment === "major" || selectedDepartment === "all" || !hasMoreCourses || isLoadingMore) {
      return
    }
    
    const nextPage = coursePage + 1
    await loadCoursesForDepartment(selectedDepartment, nextPage, false)
  }

  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return
      
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (!scrollContainer) return
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      
      // Load more when within 100px of bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreCourses && !isLoadingMore) {
        loadMoreCourses()
      }
    }

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [hasMoreCourses, isLoadingMore, selectedDepartment])

  const handleCourseToggle = (course: Course) => {
    // Don't allow selecting courses that are already completed in other semesters
    if (completedCourses.has(course.id)) {
      return
    }
    
    const newSelected = new Map(selectedCourses)
    if (newSelected.has(course.id)) {
      newSelected.delete(course.id)
    } else {
      newSelected.set(course.id, { ...course, grade: 'A' })
    }
    setSelectedCourses(newSelected)
  }

  const handleGradeChange = (courseId: string, grade: string) => {
    const newSelected = new Map(selectedCourses)
    const course = newSelected.get(courseId)
    if (course) {
      course.grade = grade
      newSelected.set(courseId, course)
      setSelectedCourses(newSelected)
    }
  }

  const handleSave = () => {
    const coursesArray = Array.from(selectedCourses.values())
    onSave(coursesArray)
    onClose()
  }

  // Determine which courses to display: search results or department courses
  const displayedCourses = useMemo(() => {
    // If searching globally (1+ chars), show search results
    if (deferredSearchQuery.length >= 1) {
      return searchResults
    }
    // Otherwise show department courses
    return departmentCourses
  }, [departmentCourses, searchResults, deferredSearchQuery])

  const totalCredits = Array.from(selectedCourses.values()).reduce((sum, course) => sum + course.credits, 0)

  const calculateGPA = () => {
    const courses = Array.from(selectedCourses.values())
    if (courses.length === 0) return 0
    
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    }
    
    const totalPoints = courses.reduce((sum, course) => {
      return sum + (gradePoints[course.grade] || 0) * course.credits
    }, 0)
    
    return (totalPoints / totalCredits).toFixed(2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!max-w-[70vw] !w-[70vw] !h-[90vh] p-0 !max-h-[90vh]"
        style={{ 
          maxWidth: '70vw', 
          width: '70vw', 
          height: '90vh', 
          maxHeight: '90vh' 
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add Courses to {semester}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full overflow-hidden">
          {/* Left Panel - Course Selection */}
          <div className="flex-1 border-r grid grid-rows-[auto_1fr] h-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold mb-4">Select Courses</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Department Filter */}
              <div className="mb-4">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="major">My Major Requirements</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.code} ({dept.count} classes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course List */}
            <div className="flex-1 p-6 overflow-hidden">
              <ScrollArea 
                ref={scrollAreaRef}
                className="h-full"
              >
                <div className="space-y-2 pr-4">
                  {loading || searchLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchLoading ? `Searching all courses for "${deferredSearchQuery}"...` : 'Loading courses...'}
                      </p>
                    </div>
                  ) : deferredSearchQuery.length >= 1 && searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No courses found matching "{deferredSearchQuery}"</p>
                    </div>
                  ) : displayedCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {selectedDepartment ? 'No courses in this department' : 'Select a department or search for courses'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {deferredSearchQuery.length >= 1 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Showing {searchResults.length} results from all courses
                          </p>
                        </div>
                      )}
                      {deferredSearchQuery.length === 0 && totalCoursesCount > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {displayedCourses.length} of {totalCoursesCount} courses
                            {hasMoreCourses && " (scroll down to load more)"}
                          </p>
                        </div>
                      )}
                      {displayedCourses.map((course, index) => {
                        const isCompleted = completedCourses.has(course.id)
                        return (
                          <div
                            key={course.id}
                            className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                              index < displayedCourses.length - 1 ? 'mb-2' : ''
                            } ${
                              isCompleted 
                                ? 'opacity-50 bg-muted cursor-not-allowed' 
                                : 'hover:bg-accent cursor-pointer'
                            }`}
                            onClick={() => handleCourseToggle(course)}
                          >
                            <Checkbox
                              checked={selectedCourses.has(course.id)}
                              disabled={isCompleted}
                              onCheckedChange={() => handleCourseToggle(course)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`font-semibold text-base ${isCompleted ? 'line-through' : ''}`}>
                                  {course.code}
                                </span>
                                <span className={`text-sm text-muted-foreground truncate ${isCompleted ? 'line-through' : ''}`}>
                                  {course.name}
                                </span>
                                {isCompleted && (
                                  <Badge variant="outline" className="text-xs">
                                    Already Completed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{course.credits} credits</Badge>
                                {course.category && (
                                  <Badge variant="outline">{course.category}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {isLoadingMore && (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">Loading more courses...</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Panel - Selected Courses with Grades */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {semester} Courses ({selectedCourses.size})
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Courses */}
            <div className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {Array.from(selectedCourses.values()).map(course => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{course.code}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{course.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={course.grade}
                          onValueChange={(value) => handleGradeChange(course.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A (4.0)</SelectItem>
                            <SelectItem value="B">B (3.0)</SelectItem>
                            <SelectItem value="C">C (2.0)</SelectItem>
                            <SelectItem value="D">D (1.0)</SelectItem>
                            <SelectItem value="F">F (0.0)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSelected = new Map(selectedCourses)
                            newSelected.delete(course.id)
                            setSelectedCourses(newSelected)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Summary and Actions */}
            <div className="border-t p-6">
              <div className="space-y-4">
                {/* Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Total Credits:</span>
                    <span className="font-bold">{totalCredits}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Projected GPA:</span>
                    <span className="font-bold">{calculateGPA()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="flex-1" size="lg">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    className="flex-1"
                    size="lg"
                    disabled={selectedCourses.size === 0}
                  >
                    Mark as Complete ({selectedCourses.size})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}