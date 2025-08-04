"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Calendar, momentLocalizer, View } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search, Plus, X, Clock, MapPin, Users, Star, Calendar as CalendarIcon, Settings } from "lucide-react"
import { ExpandableClassCard } from "@/components/expandable-class-card"
import { GroupedClassCard } from "@/components/grouped-class-card"
import Link from "next/link"

const localizer = momentLocalizer(moment)

interface ClassData {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  time: string
  location: string
  credits?: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
}

interface ScheduledClass extends ClassData {
  colorBg: string
  colorHex: string
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
}

// API function
const fetchClasses = async (filters: any = {}): Promise<ClassData[]> => {
  try {
    const params = new URLSearchParams()
    if (filters.subject) params.set('subject', filters.subject)
    if (filters.search) params.set('search', filters.search)
    if (filters.level) params.set('level', filters.level)
    params.set('limit', '4000')
    
    const url = `http://localhost:8000/api/classes?${params}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch classes')
    
    const data = await response.json()
    return data.classes || []
  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

// Group classes by subject and number
const groupClasses = (classes: ClassData[]): GroupedClass[] => {
  const groups = new Map<string, GroupedClass>()
  
  classes.forEach(cls => {
    const key = `${cls.subject}-${cls.number}`
    
    if (!groups.has(key)) {
      groups.set(key, {
        subject: cls.subject,
        number: cls.number,
        title: cls.title,
        credits: cls.credits,
        sections: []
      })
    }
    
    groups.get(key)!.sections.push(cls)
  })
  
  return Array.from(groups.values())
}

// Class colors for visual distinction
const classColors = [
  { bg: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-green-500', hex: '#10b981' },
  { bg: 'bg-purple-500', hex: '#8b5cf6' },
  { bg: 'bg-orange-500', hex: '#f97316' },
  { bg: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-teal-500', hex: '#14b8a6' },
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-red-500', hex: '#ef4444' }
]

export default function SchedulerPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("week")
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCourseLevel, setSelectedCourseLevel] = useState("all")
  const [selectedMajor, setSelectedMajor] = useState("all")
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [displayLimit, setDisplayLimit] = useState(50)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Filtered grouped classes
  const filteredGroupedClasses = groupedClasses.filter(group => {
    const classCode = `${group.subject} ${group.number}`.toLowerCase()
    const matchesSearch = !searchTerm || 
      classCode.includes(searchTerm.toLowerCase()) ||
      group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = selectedSubject === "all" || group.subject === selectedSubject
    
    const matchesLevel = selectedLevel === "all" || 
      (selectedLevel === "undergraduate" && parseInt(group.number[0]) < 5) ||
      (selectedLevel === "graduate" && parseInt(group.number[0]) >= 5)
    
    const courseNum = parseInt(group.number)
    const matchesCourseLevel = selectedCourseLevel === "all" ||
      (selectedCourseLevel === "1000" && courseNum >= 1000 && courseNum < 2000) ||
      (selectedCourseLevel === "2000" && courseNum >= 2000 && courseNum < 3000) ||
      (selectedCourseLevel === "3000" && courseNum >= 3000 && courseNum < 4000) ||
      (selectedCourseLevel === "4000" && courseNum >= 4000 && courseNum < 5000) ||
      (selectedCourseLevel === "5000+" && courseNum >= 5000)
    
    
    // TODO: Implement major filtering when major data is available
    const matchesMajor = selectedMajor === "all" // For now, always true
    
    return matchesSearch && matchesSubject && matchesLevel && matchesCourseLevel && matchesMajor
  })

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50)
  }, [searchTerm, selectedSubject, selectedCourseLevel, selectedMajor])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const classesData = await fetchClasses()
      setClasses(classesData)
      
      // Group classes by subject and number
      const grouped = groupClasses(classesData)
      setGroupedClasses(grouped)
      
      // Extract unique subjects
      const subjects = Array.from(new Set(classesData.map(cls => cls.subject))).sort()
      setAvailableSubjects(subjects)
      
      setLoading(false)
    }
    
    loadData()
  }, [])

  const parseTimeToEvents = (classData: ScheduledClass) => {
    if (!classData.time || classData.time === 'TBA') return []
    
    // Parse "MWF 10:00 am-10:50 am" format
    const parts = classData.time.split(' ')
    if (parts.length < 3) return []
    
    const days = parts[0]
    const timeRange = parts.slice(1).join(' ')
    const [startTimeStr, endTimeStr] = timeRange.split('-')
    
    // Parse times
    const parseTime = (timeStr: string) => {
      const cleanTime = timeStr.trim()
      const isPM = cleanTime.includes('pm')
      const isAM = cleanTime.includes('am')
      const timeOnly = cleanTime.replace(/[ap]m/g, '').trim()
      const [hourStr, minStr] = timeOnly.split(':')
      let hour = parseInt(hourStr)
      const min = parseInt(minStr) || 0
      
      if (isPM && hour !== 12) hour += 12
      if (isAM && hour === 12) hour = 0
      
      return { hour, min }
    }
    
    const startTime = parseTime(startTimeStr)
    const endTime = parseTime(endTimeStr)
    
    // Map day letters to day numbers (0 = Sunday)
    const dayMap: { [key: string]: number } = {
      'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5
    }
    
    const classDays = []
    let i = 0
    while (i < days.length) {
      if (i < days.length - 1 && days.slice(i, i + 2) === 'Th') {
        classDays.push(4)
        i += 2
      } else if (days[i] === 'R') {
        classDays.push(4)
        i++
      } else {
        classDays.push(dayMap[days[i]] || 1)
        i++
      }
    }
    
    // Create calendar events for each day - generate for multiple weeks to support all views
    const events = []
    const today = new Date()
    const startOfSemester = new Date(today.getFullYear(), today.getMonth() - 1, 1) // Start a month ago
    const endOfSemester = new Date(today.getFullYear(), today.getMonth() + 4, 30) // End 4 months from now
    
    classDays.forEach(dayOfWeek => {
      // Find all dates for this day of week within the semester
      const currentDate = new Date(startOfSemester)
      
      // Move to the first occurrence of this day of week
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Create events for every week until end of semester
      while (currentDate <= endOfSemester) {
        const startDate = new Date(currentDate)
        startDate.setHours(startTime.hour, startTime.min, 0, 0)
        
        const endDate = new Date(startDate)
        endDate.setHours(endTime.hour, endTime.min, 0, 0)
        
        events.push({
          id: `${classData.id}-${dayOfWeek}-${startDate.toISOString()}`,
          title: `${classData.subject} ${classData.number}`,
          start: startDate,
          end: endDate,
          resource: classData
        })
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7)
      }
    })
    
    return events
  }

  const addToSchedule = (classData: ClassData) => {
    if (scheduledClasses.find(cls => cls.id === classData.id)) return
    
    const colorIndex = scheduledClasses.length % classColors.length
    const selectedColor = classColors[colorIndex]
    
    const newScheduledClass: ScheduledClass = {
      ...classData,
      colorBg: selectedColor.bg,
      colorHex: selectedColor.hex
    }
    
    setScheduledClasses(prev => [...prev, newScheduledClass])
    
    // Add calendar events
    const newEvents = parseTimeToEvents(newScheduledClass)
    setEvents(prev => [...prev, ...newEvents])
  }

  const removeFromSchedule = (classId: string) => {
    setScheduledClasses(prev => prev.filter(cls => cls.id !== classId))
    setEvents(prev => prev.filter(event => !event.id.startsWith(classId)))
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
              <Link href="/scheduler" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Scheduler
              </Link>
              <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
                className="pl-8 w-[250px] h-9 bg-muted/50 border-0"
              />
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - 2 Panel Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        
        {/* Left Panel - Available Classes (25% width) */}
        <div className="w-[25%] border-r border-border bg-muted/20 flex flex-col">
          {/* Compact Filters */}
          <div className="p-2 border-b border-border bg-background">
            <div className="flex items-center gap-1 mb-2">
              {scheduledClasses.length > 0 && (
                <Badge variant="secondary" className="px-1 py-0 text-xs">
                  {scheduledClasses.length}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search by class code (ECE 2214)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div className="flex gap-1">
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  open={openDropdown === 'subject'}
                  onOpenChange={(open) => setOpenDropdown(open ? 'subject' : null)}
                >
                  <SelectTrigger className="h-7 text-xs w-1/2 focus:ring-2 focus:ring-red-500 focus:border-red-500 data-[state=open]:ring-2 data-[state=open]:ring-red-500 data-[state=open]:border-red-500">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] overflow-y-auto p-1 w-fit min-w-[120px]">
                    <SelectItem value="all">All Departments</SelectItem>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject} className="text-left">{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedCourseLevel} 
                  onValueChange={setSelectedCourseLevel}
                  open={openDropdown === 'level'}
                  onOpenChange={(open) => setOpenDropdown(open ? 'level' : null)}
                >
                  <SelectTrigger className="h-7 text-xs w-1/2 focus:ring-2 focus:ring-red-500 focus:border-red-500 data-[state=open]:ring-2 data-[state=open]:ring-red-500 data-[state=open]:border-red-500">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="w-fit min-w-[100px]">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1000">1000-Level</SelectItem>
                    <SelectItem value="2000">2000-Level</SelectItem>
                    <SelectItem value="3000">3000-Level</SelectItem>
                    <SelectItem value="4000">4000-Level</SelectItem>
                    <SelectItem value="5000+">5000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            </div>
            
            <div className="text-xs text-muted-foreground mt-1">
              {filteredGroupedClasses.length} found
            </div>
          </div>
          
          {/* Class List */}
          <div className="flex-1 overflow-y-auto p-1">
            <div className="grid grid-cols-1 gap-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
              ) : filteredGroupedClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg">No classes found</div>
                  <div className="text-sm">Try adjusting your filters</div>
                </div>
              ) : (
                <>
                {filteredGroupedClasses.slice(0, displayLimit).map((group) => {
                  const isAnyScheduled = group.sections.some(section => 
                    scheduledClasses.find(scheduled => scheduled.id === section.id)
                  )
                  
                  return (
                    <GroupedClassCard
                      key={`${group.subject}-${group.number}`}
                      groupedClass={group}
                      isAnyScheduled={isAnyScheduled}
                      onAddToSchedule={addToSchedule}
                      onRemoveFromSchedule={removeFromSchedule}
                    />
                  )
                })}
                
                {/* Load More Button */}
                {filteredGroupedClasses.length > displayLimit && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setDisplayLimit(prev => prev + 50)}
                      size="sm"
                    >
                      Load More ({filteredGroupedClasses.length - displayLimit} remaining)
                    </Button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar (75% width) */}
        <div className="w-[75%] flex flex-col">
          
          <div className="flex-1 p-2">
            <div className="h-full relative">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                style={{ height: '100%' }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.resource?.colorHex || '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    padding: '2px 4px'
                  }
                })}
                formats={{
                  timeGutterFormat: 'h:mm A',
                  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    localizer.format(start, 'h:mm A', culture) + ' - ' +
                    localizer.format(end, 'h:mm A', culture)
                }}
                min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
                max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
              />
              
              {/* Empty state overlay */}
              {events.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-muted-foreground bg-background/80 p-6 rounded-lg">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <div className="text-lg font-medium mb-1">No classes scheduled</div>
                    <div className="text-sm">Add classes from the left panel to see them here</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}