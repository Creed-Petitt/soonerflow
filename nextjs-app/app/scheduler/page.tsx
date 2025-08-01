"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Settings, User, Search, Plus, ChevronRight, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectStatusCard } from "@/components/ui/expandable-card"
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
})

// Types for API data
interface ClassData {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  rating: number
  difficulty: number
  wouldTakeAgain: number
  time: string
  location: string
  days: string[]
  credits: number
  description: string
  prerequisites: string
  genEd: string
  sections: Array<{
    id: string
    time: string
    instructor: string
    seats: string
  }>
}

// API functions
const fetchClasses = async (): Promise<ClassData[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/classes?limit=50')
    if (!response.ok) {
      throw new Error('Failed to fetch classes')
    }
    const data = await response.json()
    console.log('Scheduler: Got classes data:', data.classes?.length || 0)
    return data.classes || [] // Extract classes from wrapped response
  } catch (error) {
    console.error('Scheduler: Error fetching classes:', error)
    return []
  }
}

const fetchUserSchedule = async (): Promise<ClassData[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/user/schedule')
    if (!response.ok) {
      throw new Error('Failed to fetch user schedule')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching user schedule:', error)
    return []
  }
}

interface ClassCardProps {
  classData: ClassData
  onAddToSchedule: (classId: string) => void
}

interface ClassItemProps {
  classData: ClassData
  onClick: () => void
}

function ClassItem({ classData, onClick }: ClassItemProps) {
  return (
    <div 
      className="p-2 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{classData.subject} {classData.number}</p>
          <p className="text-xs text-muted-foreground truncate">{classData.time}</p>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
      </div>
    </div>
  )
}

function ScheduleCalendar({ 
  events, 
  view, 
  setView, 
  eventStyleGetter,
  toolbar = true
}: {
  events: any[]
  view: View
  setView: (view: View) => void
  eventStyleGetter: (event: any) => any
  toolbar?: boolean
}) {
  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        eventPropGetter={eventStyleGetter}
        step={30}
        timeslots={2}
        min={new Date(2025, 7, 1, 8, 0)}
        max={new Date(2025, 7, 1, 21, 0)}
        defaultDate={new Date(2025, 7, 4)}
        toolbar={toolbar}
        className="bg-background border border-border rounded-lg"
      />
    </div>
  )
}

function ClassCard({ classData, onAddToSchedule }: ClassCardProps) {
  return (
    <ProjectStatusCard
      title={`${classData.subject} ${classData.number}`}
      progress={Math.round((classData.rating / 5) * 100)}
      dueDate="Spring 2025"  
      contributors={[{ name: classData.instructor }]}
      tasks={[
        { title: `Rating: ${classData.rating}/5.0`, completed: classData.rating >= 4.0 },
        { title: `Would take again: ${classData.wouldTakeAgain}%`, completed: classData.wouldTakeAgain >= 80 },
        { title: `Difficulty: ${classData.difficulty}/5.0`, completed: classData.difficulty <= 3.0 }
      ]}
      githubStars={Math.round(classData.rating * 20)}
      openIssues={classData.sections.length}
    />
  )
}

export default function SchedulerPage() {
  const [view, setView] = useState<View>("week")
  const [events, setEvents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(256) // 64 * 4 = 256px
  const [rightPanelWidth, setRightPanelWidth] = useState(320) // 80 * 4 = 320px
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)

  // Resize handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const windowWidth = window.innerWidth
    if (isResizing === 'left') {
      const newWidth = Math.min(Math.max(e.clientX, 200), 400)
      setLeftPanelWidth(newWidth)
    } else if (isResizing === 'right') {
      const newWidth = Math.min(Math.max(windowWidth - e.clientX, 200), 400)
      setRightPanelWidth(newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [classesData, scheduleData] = await Promise.all([
        fetchClasses(),
        fetchUserSchedule()
      ])
      
      setClasses(classesData)
      
      // Convert schedule data to calendar events
      const calendarEvents = scheduleData.flatMap(cls => {
        const { classDays, startHour, startMin, endHour, endMin } = parseTimeToDate(cls.time)
        
        return classDays.map(dayOfWeek => {
          const startDate = new Date(2025, 7, 4) // Start of week (Monday Aug 4, 2025)
          startDate.setDate(startDate.getDate() + (dayOfWeek - 1)) // Adjust to correct day
          startDate.setHours(startHour, startMin, 0, 0)
          
          const endDate = new Date(startDate)
          endDate.setHours(endHour, endMin, 0, 0)
          
          return {
            id: `${cls.id}-${dayOfWeek}`,
            title: `${cls.subject} ${cls.number}`,
            start: startDate,
            end: endDate,
            resource: cls
          }
        })
      })
      
      setEvents(calendarEvents)
      setLoading(false)
    }
    
    loadData()
  }, [])

  const handleAddClass = (classId: string) => {
    const classData = classes.find(cls => cls.id === classId)
    if (classData) {
      handleAddToSchedule(classData)
    }
  }

  const parseTimeToDate = (timeString: string, baseDate: Date = new Date()) => {
    // Check if timeString is valid
    if (!timeString || timeString === 'TBA' || !timeString.includes(' ') || !timeString.includes('-')) {
      return { classDays: [1], startHour: 9, startMin: 0, endHour: 10, endMin: 0 }
    }
    
    // Parse "TTh 14:00-15:15" or "MWF 10:00-10:50" format
    const [days, timeRange] = timeString.split(' ')
    const [startTime, endTime] = timeRange.split('-')
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const dayMap: { [key: string]: number } = {
      'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5
    }
    
    const classDays = []
    let i = 0
    while (i < days.length) {
      if (i < days.length - 1 && days.slice(i, i + 2) === 'Th') {
        classDays.push(4) // Thursday
        i += 2
      } else {
        classDays.push(dayMap[days[i]] || 1)
        i++
      }
    }
    
    return { classDays, startHour, startMin, endHour, endMin }
  }

  const handleAddToSchedule = (classData: ClassData) => {
    const { classDays, startHour, startMin, endHour, endMin } = parseTimeToDate(classData.time)
    
    // Create events for each day of the week the class meets
    const newEvents = classDays.map(dayOfWeek => {
      const startDate = new Date(2025, 7, 4) // Start of week (Monday Aug 4, 2025)
      startDate.setDate(startDate.getDate() + (dayOfWeek - 1)) // Adjust to correct day
      startDate.setHours(startHour, startMin, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setHours(endHour, endMin, 0, 0)
      
      return {
        id: `${classData.id}-${dayOfWeek}-${Date.now()}`,
        title: `${classData.subject} ${classData.number}`,
        start: startDate,
        end: endDate,
        resource: classData
      }
    })
    
    setEvents([...events, ...newEvents])
    console.log(`Added ${classData.subject} ${classData.number} to schedule`)
  }

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.resource?.subject === 'ECE' ? '#3174ad' : '#ad5131'
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="border-b border-border px-6 py-3 flex-shrink-0">
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
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content - 3 Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Course Browser */}
          <div 
            className="border-r border-border bg-muted/20 flex flex-col flex-shrink-0"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold mb-3">Browse Courses</h2>
              <div className="space-y-2">
                <Input placeholder="Search courses..." className="h-8" />
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {loading ? "Loading..." : "Available Classes"}
                </h3>
                {loading ? (
                  <div className="text-center text-muted-foreground py-4">Loading classes...</div>
                ) : (
                  classes.slice(0, 20).map((cls) => (
                    <ClassItem
                      key={cls.id}
                      classData={cls}
                      onClick={() => setSelectedClass(cls)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Left Resize Handle */}
          <div 
            className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors"
            onMouseDown={() => setIsResizing('left')}
          />

          {/* Center - Calendar */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">Schedule Builder</h1>
                  <p className="text-sm text-muted-foreground">Spring 2025</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Draft</Badge>
                  <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button size="sm">
                    Lock Schedule
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4">
              <ScheduleCalendar
                events={events}
                view={view}
                setView={setView}
                eventStyleGetter={eventStyleGetter}
                toolbar={false}
              />
            </div>
          </div>

          {/* Right Resize Handle */}
          {selectedClass && (
            <div 
              className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={() => setIsResizing('right')}
            />
          )}

          {/* Right Panel - Class Details */}
          {selectedClass && (
            <div 
              className="border-l border-border bg-muted/20 p-4 overflow-y-auto flex-shrink-0"
              style={{ width: `${rightPanelWidth}px` }}
            >
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedClass.subject} {selectedClass.number}</h2>
                  <p className="text-muted-foreground">{selectedClass.title}</p>
                </div>

                <ClassCard classData={selectedClass} onAddToSchedule={handleAddClass} />

                <div className="space-y-3">
                  <h3 className="font-medium">Available Sections</h3>
                  {selectedClass.sections.map((section) => (
                    <div key={section.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Section {section.id}</span>
                        <Badge variant={section.seats === "Full" ? "destructive" : "default"}>
                          {section.seats}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {section.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {section.instructor}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {selectedClass.location}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        disabled={section.seats === "Full"}
                        onClick={() => handleAddClass(selectedClass.id)}
                      >
                        {section.seats === "Full" ? "Full" : "Add to Schedule"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}