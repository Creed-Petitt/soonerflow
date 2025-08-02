"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Settings, 
  User, 
  Search, 
  Filter, 
  Star, 
  Users, 
  Clock, 
  MapPin,
  Info,
  BookOpen,
  Award
} from "lucide-react"
import Link from "next/link"
import { usePagination } from "@/hooks/use-pagination"

interface Class {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  credits: number
  time: string
  location: string
  days: string[]
  available_seats: number
  total_seats: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
  description: string
  prerequisites: string
  genEd: string
  sections: any[]
}

interface ClassResponse {
  classes: Class[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    departments: string[]
    levels: string[]
    credits: number[]
    semesters: string[]
  }
}

export default function BrowsePage() {
  const [classes, setClasses] = React.useState<Class[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = React.useState({
    departments: [] as string[],
    levels: [] as string[],
    credits: [] as number[],
    semesters: [] as string[]
  })
  
  const [search, setSearch] = React.useState("")
  const [selectedDepartment, setSelectedDepartment] = React.useState("all")
  const [selectedLevel, setSelectedLevel] = React.useState("all")
  const [selectedCredits, setSelectedCredits] = React.useState("all")
  const [selectedSemester, setSelectedSemester] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  
  const paginationData = usePagination({
    currentPage,
    totalPages: pagination.totalPages,
    paginationItemsToDisplay: 5
  })

  const fetchClasses = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(selectedDepartment !== "all" && { subject: selectedDepartment }),
        ...(selectedLevel !== "all" && { level: selectedLevel }),
        ...(selectedCredits !== "all" && { credits: selectedCredits }),
        ...(selectedSemester !== "all" && { semester: selectedSemester }),
      })
      
      const url = `http://localhost:8000/api/classes?${params}`
      console.log('Fetching from:', url)
      
      const response = await fetch(url)
      console.log('Response status:', response.status, response.ok)
      
      const data: ClassResponse = await response.json()
      console.log('Got data keys:', Object.keys(data))
      console.log('Classes count:', data.classes?.length || 0)
      
      setClasses(data.classes || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
      
      // Keep existing filters, don't override departments
      if (data.classes && data.classes.length > 0) {
        setFilters(prev => ({
          ...prev,
          levels: ["Undergraduate", "Graduate"],
          credits: [1, 2, 3, 4, 5, 6],
          semesters: ["Spring", "Fall", "Summer"]
        }))
      }
      
      console.log('State updated successfully')
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }, [search, selectedDepartment, selectedLevel, selectedCredits, selectedSemester, currentPage])

  // Load all departments on first load
  React.useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/classes?limit=200')
        const data = await response.json()
        if (data.classes) {
          const uniqueSubjects = Array.from(new Set(data.classes.map((cls: any) => cls.subject))).sort()
          setFilters(prev => ({
            ...prev,
            departments: uniqueSubjects
          }))
        }
      } catch (error) {
        console.error('Failed to load departments:', error)
      }
    }
    
    loadDepartments()
  }, [])

  React.useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    fetchClasses()
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedDepartment("all")
    setSelectedLevel("all")
    setSelectedCredits("all")
    setSelectedSemester("all")
    setCurrentPage(1)
  }

  const getAvailabilityBadge = (cls: Class) => {
    // available_seats from backend is the number of available seats
    if (cls.available_seats > 10) return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Open</Badge>
    if (cls.available_seats > 0) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Limited</Badge>
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Full</Badge>
  }

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-muted-foreground'
    if (difficulty < 2.5) return 'text-green-600 dark:text-green-400'
    if (difficulty < 3.5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <nav className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation Links */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/scheduler" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Scheduler
              </Link>
              <Link href="/browse" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Browse Classes
              </Link>
              <Link href="/progress" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Degree Progress
              </Link>
              <Link href="/professors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Professors
              </Link>
              <Link href="/canvas" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Canvas
              </Link>
            </div>
          </div>

          {/* Right side - Search and Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search classes..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 w-[250px] h-9 bg-muted/50 border-0"
              />
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Browse Classes</h1>
          <p className="text-muted-foreground">Detailed course research and exploration - {pagination.total} courses available</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={(value) => {
                  setSelectedDepartment(value)
                  handleFilterChange()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="all">All Departments</SelectItem>
                    {filters.departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select value={selectedLevel} onValueChange={(value) => {
                  setSelectedLevel(value)
                  handleFilterChange()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="all">All Levels</SelectItem>
                    {filters.levels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Credits</label>
                <Select value={selectedCredits} onValueChange={(value) => {
                  setSelectedCredits(value)
                  handleFilterChange()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Credits" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="all">All Credits</SelectItem>
                    {filters.credits.map((credit) => (
                      <SelectItem key={credit} value={credit.toString()}>{credit} Credit{credit !== 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Select value={selectedSemester} onValueChange={(value) => {
                  setSelectedSemester(value)
                  handleFilterChange()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {filters.semesters.map((semester) => (
                      <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available Classes</CardTitle>
              <div className="text-sm text-muted-foreground">
                Showing {classes.length} of {pagination.total} results
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-muted-foreground">Loading classes...</div>
              </div>
            ) : classes.length === 0 ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes found matching your criteria</p>
                  <Button variant="outline" className="mt-2" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{cls.subject} {cls.number}</div>
                            <div className="text-xs text-muted-foreground">
                              Section {cls.sections[0]?.id || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{cls.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {cls.genEd || 'General'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger className="text-left hover:underline">
                              {cls.instructor}
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">{cls.instructor}</h4>
                                <div className="flex items-center gap-4 text-sm">
                                  {cls.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{cls.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {cls.difficulty && (
                                    <div className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      <span className={getDifficultyColor(cls.difficulty)}>
                                        {cls.difficulty.toFixed(1)} difficulty
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Click to view full professor profile and ratings
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {cls.days.length > 0 ? cls.days.join(', ') : 'TBA'}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {cls.time}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cls.credits}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getAvailabilityBadge(cls)}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {cls.available_seats}/{cls.total_seats || 'TBA'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cls.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{cls.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Info className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{cls.subject} {cls.number}: {cls.title}</DialogTitle>
                                  <DialogDescription>
                                    {cls.genEd || 'General'} • {cls.credits} Credits
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Course Description</h4>
                                    <p className="text-sm text-muted-foreground">{cls.description}</p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Schedule</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Days: {cls.days.join(', ') || 'TBA'}</div>
                                        <div>Time: {cls.time}</div>
                                        <div>Location: {cls.location}</div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Enrollment</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Total Seats: {cls.total_seats || 'TBA'}</div>
                                        <div>Available: {cls.available_seats}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {cls.prerequisites && (
                                    <div>
                                      <h4 className="font-medium mb-2">Prerequisites</h4>
                                      <p className="text-sm text-muted-foreground">{cls.prerequisites}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between pt-4">
                                    <div className="flex gap-4">
                                      {cls.rating && (
                                        <div className="flex items-center gap-1">
                                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                          <span className="text-sm">{cls.rating.toFixed(1)} rating</span>
                                        </div>
                                      )}
                                      {cls.difficulty && (
                                        <div className="flex items-center gap-1">
                                          <Award className="h-4 w-4" />
                                          <span className={`text-sm ${getDifficultyColor(cls.difficulty)}`}>
                                            {cls.difficulty.toFixed(1)} difficulty
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <Button>Add to Schedule</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        {pagination.hasPrev && (
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(currentPage - 1)
                              }}
                            />
                          </PaginationItem>
                        )}
                        
                        {paginationData.showLeftEllipsis && (
                          <PaginationItem>
                            <PaginationLink 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(1)
                              }}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {paginationData.showLeftEllipsis && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {paginationData.pages.map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"  
                              isActive={page === currentPage}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        {paginationData.showRightEllipsis && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {paginationData.showRightEllipsis && (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pagination.totalPages)
                              }}
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {pagination.hasNext && (
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(currentPage + 1)
                              }}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}