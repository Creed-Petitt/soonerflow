"use client"

import { useState, useEffect, useMemo, useDeferredValue } from "react"
import { useSession } from "next-auth/react"
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
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [departments, setDepartments] = useState<{code: string, name: string, count: number}[]>([])
  const [departmentCache, setDepartmentCache] = useState<Record<string, Course[]>>({})
  const [userMajor, setUserMajor] = useState<string | null>(null)
  const { data: session } = useSession()

  // Load user's major when modal opens
  useEffect(() => {
    const fetchUserMajor = async () => {
      if (session?.user?.email && !userMajor) {
        try {
          const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`)
          if (response.ok) {
            const data = await response.json()
            setUserMajor(data.majorName)
          }
        } catch (error) {
          console.error('Failed to fetch user major:', error)
        }
      }
    }
    
    if (isOpen) {
      fetchUserMajor()
    }
  }, [isOpen, session?.user?.email, userMajor])

  // Set default to major once userMajor is loaded
  useEffect(() => {
    if (userMajor && !selectedDepartment) {
      setSelectedDepartment("major")
    }
  }, [userMajor, selectedDepartment])

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
    }
  }, [isOpen, existingCourses])

  // Load courses when department changes
  useEffect(() => {
    if (selectedDepartment === "major") {
      loadMajorCourses()
    } else if (selectedDepartment && selectedDepartment !== "all") {
      loadCoursesForDepartment(selectedDepartment)
    }
  }, [selectedDepartment, userMajor])

  // Perform global search when search query changes
  useEffect(() => {
    const searchGlobally = async () => {
      if (deferredSearchQuery.length >= 2) {
        try {
          setSearchLoading(true)
          const response = await fetch(`/api/classes?search=${encodeURIComponent(deferredSearchQuery)}&limit=100`)
          const data = await response.json()
          
          if (data.classes && data.classes.length > 0) {
            // Transform to unique courses
            const uniqueCourses = new Map()
            data.classes.forEach((cls: any) => {
              const courseKey = `${cls.subject}-${cls.number || cls.courseNumber}`
              if (!uniqueCourses.has(courseKey)) {
                uniqueCourses.set(courseKey, {
                  id: courseKey,
                  code: `${cls.subject} ${cls.number || cls.courseNumber}`,
                  name: cls.title,
                  credits: cls.credits || 3,
                  category: cls.subject
                })
              }
            })
            setSearchResults(Array.from(uniqueCourses.values()))
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
        // Clear search results when query is too short
        setSearchResults([])
        setSearchLoading(false)
      }
    }

    searchGlobally()
  }, [deferredSearchQuery])

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/classes/departments')
      const data = await response.json()
      if (data.departments) {
        setDepartments(data.departments)
        // Only set default if nothing is selected
        if (!selectedDepartment) {
          // Default to major requirements if user has a major, otherwise first department
          if (userMajor) {
            setSelectedDepartment("major")
          } else if (data.departments.length > 0) {
            setSelectedDepartment(data.departments[0].code)
          }
        }
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
        // Transform major courses to the expected format and deduplicate
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

  const loadCoursesForDepartment = async (dept: string) => {
    // Check cache first
    if (departmentCache[dept]) {
      setDepartmentCourses(departmentCache[dept])
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/classes?subject=${dept}&limit=1000`)
      const data = await response.json()
      
      if (data.classes && data.classes.length > 0) {
        // Transform to unique courses
        const uniqueCourses = new Map()
        data.classes.forEach((cls: any) => {
          const courseKey = `${cls.subject}-${cls.number || cls.courseNumber}`
          if (!uniqueCourses.has(courseKey)) {
            uniqueCourses.set(courseKey, {
              id: courseKey,
              code: `${cls.subject} ${cls.number || cls.courseNumber}`,
              name: cls.title,
              credits: cls.credits || 3,
              category: cls.subject
            })
          }
        })
        const courses = Array.from(uniqueCourses.values())
        
        // Cache the department data
        setDepartmentCache(prev => ({ ...prev, [dept]: courses }))
        setDepartmentCourses(courses)
      } else {
        setDepartmentCourses([])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      setDepartmentCourses([])
    } finally {
      setLoading(false)
    }
  }


  const handleCourseToggle = (course: Course) => {
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
    // If searching globally (2+ chars), show search results
    if (deferredSearchQuery.length >= 2) {
      return searchResults
    }
    // Otherwise show department courses (with optional local filtering)
    if (deferredSearchQuery.length === 1) {
      // Local filter for single character
      const search = deferredSearchQuery.toLowerCase()
      return departmentCourses.filter(course => 
        course.code.toLowerCase().includes(search) ||
        course.name.toLowerCase().includes(search)
      )
    }
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
              <ScrollArea className="h-full" style={{ maxHeight: 'calc(60vh + 220px)' }}>
                <div className="space-y-2 pr-4" style={{ paddingBottom: '0 !important', marginBottom: '0 !important' }}>
                  {loading || searchLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchLoading ? `Searching all courses for "${deferredSearchQuery}"...` : 'Loading courses...'}
                      </p>
                    </div>
                  ) : deferredSearchQuery.length >= 2 && searchResults.length === 0 ? (
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
                      {deferredSearchQuery.length >= 2 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Showing {searchResults.length} results from all courses
                          </p>
                        </div>
                      )}
                      {displayedCourses.map((course, index) => (
                        <div
                          key={course.id}
                          className={`flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors ${
                            index < displayedCourses.length - 1 ? 'mb-2' : ''
                          }`}
                        onClick={() => handleCourseToggle(course)}
                      >
                        <Checkbox
                          checked={selectedCourses.has(course.id)}
                          onCheckedChange={() => handleCourseToggle(course)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-base">{course.code}</span>
                            <span className="text-sm text-muted-foreground truncate">{course.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{course.credits} credits</Badge>
                            {course.category && (
                              <Badge variant="outline">{course.category}</Badge>
                            )}
                          </div>
                        </div>
                        </div>
                      ))}
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
              <ScrollArea className="h-full max-h-[50vh]">
                <div className="space-y-2 pr-2 pb-0">
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