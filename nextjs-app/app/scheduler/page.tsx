"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar/event-calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import CustomNavbar from "@/components/custom-navbar"
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  FileDown, 
  Printer, 
  BookOpen, 
  GraduationCap,
  Clock,
  MapPin,
  User
} from "lucide-react"
import { LabSwitchingDropdown } from "@/components/lab-switching-dropdown"
import { useSchedule } from "@/hooks/use-schedule"
import useCourseStore from "@/stores/useCourseStore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  available_seats?: number
  total_seats?: number
  description?: string
  type?: string
  grade?: string  // For completed courses
  semester?: string  // When the course was/will be taken
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
  labSections?: ClassData[]
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

// Enrolled Class Card Component
function EnrolledClassCard({ 
  classData, 
  onRemove, 
  onSwitchSection,
  availableSections,
  availableLabSections 
}: { 
  classData: ScheduledClass
  onRemove: () => void
  onSwitchSection?: (newSection: ClassData) => void
  availableSections?: ClassData[]
  availableLabSections?: ClassData[]
}) {
  const hasMultipleSections = (availableSections && availableSections.length > 1) || 
                              (classData.type === 'Lab with No Credit' && availableLabSections && availableLabSections.length > 1)
  
  return (
    <Card className="p-2 relative group hover:shadow-md transition-shadow">
      {/* Color indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${classData.colorBg} rounded-l`} />
      
      <div className="pl-2">
        {/* Header with course code and remove button */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-sm">{classData.subject} {classData.number}</span>
            {/* Course title */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {classData.title}
            </p>
          </div>
          
          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function SchedulerPage() {
  const router = useRouter()
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])
  
  // Use the schedule hook for persistent storage
  const {
    scheduledClasses: persistedClasses,
    addClass: addToPersistedSchedule,
    removeClass: removeFromPersistedSchedule,
    isAuthenticated,
    isSaving,
    loading: scheduleLoading,
  } = useSchedule()
  
  // Get scheduled courses from Zustand store
  const scheduledCoursesFromStore = useCourseStore((state) => state.scheduledCourses)
  const removeFromSchedule = useCourseStore((state) => state.removeFromSchedule)
  const addToScheduleStore = useCourseStore((state) => state.addToSchedule)
  
  // Local scheduled classes state (includes color info)
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  
  // Credit tracking
  const totalCredits = scheduledClasses.reduce((sum, cls) => sum + (cls.credits || 3), 0)
  const creditLimit = 21
  
  // Sync persisted classes with local state on load
  useEffect(() => {
    if (!scheduleLoading && persistedClasses && persistedClasses.length > 0) {
      const mappedClasses = persistedClasses.map((cls: any, index: number) => ({
        ...cls,
        number: cls.number || cls.courseNumber,
        colorBg: classColors[index % classColors.length].bg,
        colorHex: cls.color || classColors[index % classColors.length].hex,
      }))
      setScheduledClasses(mappedClasses)
      
      // Also sync with Zustand store for status tracking
      mappedClasses.forEach(cls => {
        addToScheduleStore({
          id: cls.id,
          code: `${cls.subject} ${cls.number}`,
          name: cls.title,
          credits: cls.credits || 3,
          section: cls.id,
          time: cls.time || 'TBA',
          location: cls.location || 'TBA',
          instructor: cls.instructor || 'TBA'
        }, 'Spring 2025')
      })
      
      // Generate calendar events
      const allEvents: CalendarEvent[] = []
      mappedClasses.forEach(cls => {
        const events = parseTimeToEvents(cls)
        allEvents.push(...events)
      })
      setCalendarEvents(allEvents)
    }
  }, [persistedClasses, scheduleLoading, addToScheduleStore])
  
  // Also sync with Zustand store
  useEffect(() => {
    const coursesArray = Array.from(scheduledCoursesFromStore.values())
    if (coursesArray.length > 0) {
      const mappedClasses = coursesArray.map((cls: any, index: number) => ({
        ...cls,
        subject: cls.code?.split(' ')[0] || cls.subject,
        number: cls.code?.split(' ')[1] || cls.number,
        colorBg: classColors[index % classColors.length].bg,
        colorHex: classColors[index % classColors.length].hex,
      }))
      setScheduledClasses(mappedClasses)
      
      // Generate calendar events
      const allEvents: CalendarEvent[] = []
      mappedClasses.forEach(cls => {
        const events = parseTimeToEvents(cls)
        allEvents.push(...events)
      })
      setCalendarEvents(allEvents)
    }
  }, [scheduledCoursesFromStore])

  // Load grouped classes for section switching
  useEffect(() => {
    const loadGroupedClasses = async () => {
      try {
        // Get unique subject codes from scheduled classes
        const subjects = [...new Set(scheduledClasses.map(cls => cls.subject))]
        
        // Load classes for each subject
        const allClasses: ClassData[] = []
        for (const subject of subjects) {
          const response = await fetch(`/api/classes?subject=${subject}&limit=500`)
          if (response.ok) {
            const data = await response.json()
            allClasses.push(...(data.classes || []))
          }
        }
        
        // Group classes
        const grouped = groupClasses(allClasses)
        setGroupedClasses(grouped)
      } catch (error) {
        console.error('Error loading grouped classes:', error)
      }
    }
    
    if (scheduledClasses.length > 0) {
      loadGroupedClasses()
    }
  }, [scheduledClasses])

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
    
    // Create calendar events for the semester
    const events = []
    const today = new Date()
    const startOfSemester = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfSemester = new Date(today.getFullYear(), today.getMonth() + 4, 30)
    
    classDays.forEach(dayOfWeek => {
      const currentDate = new Date(startOfSemester)
      
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      while (currentDate <= endOfSemester) {
        const startDate = new Date(currentDate)
        startDate.setHours(startTime.hour, startTime.min, 0, 0)
        
        const endDate = new Date(startDate)
        endDate.setHours(endTime.hour, endTime.min, 0, 0)
        
        events.push({
          id: `${classData.id}-${dayOfWeek}-${startDate.toISOString()}`,
          title: `${classData.subject} ${classData.number}`,
          description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location}`,
          start: startDate,
          end: endDate,
          color: classData.colorBg === 'bg-blue-500' ? 'sky' : 
                 classData.colorBg === 'bg-green-500' ? 'emerald' :
                 classData.colorBg === 'bg-purple-500' ? 'violet' :
                 classData.colorBg === 'bg-orange-500' ? 'orange' :
                 classData.colorBg === 'bg-pink-500' ? 'rose' :
                 classData.colorBg === 'bg-teal-500' ? 'teal' :
                 classData.colorBg === 'bg-indigo-500' ? 'indigo' :
                 classData.colorBg === 'bg-red-500' ? 'red' : 'gray',
          location: classData.location
        })
        
        currentDate.setDate(currentDate.getDate() + 7)
      }
    })
    
    return events
  }

  // Group classes helper
  const groupClasses = (classes: ClassData[]): GroupedClass[] => {
    const groups = new Map<string, GroupedClass>()
    
    classes.forEach(cls => {
      const key = `${cls.subject}-${cls.number}`
      const isLabSection = cls.type === 'Lab with No Credit'
      
      if (!groups.has(key)) {
        groups.set(key, {
          subject: cls.subject,
          number: cls.number,
          title: cls.title,
          credits: cls.credits,
          sections: [],
          labSections: []
        })
      }
      
      const group = groups.get(key)!
      
      if (isLabSection) {
        group.labSections!.push(cls)
      } else {
        group.sections.push(cls)
      }
    })
    
    return Array.from(groups.values()).filter(group => group.sections.length > 0)
  }

  const handleRemoveFromSchedule = (classId: string) => {
    const classToRemove = scheduledClasses.find(cls => cls.id === classId)
    if (!classToRemove) return
    
    const classesToRemove = [classId]
    
    // If removing a lecture, also remove associated lab sections
    if (classToRemove.type !== 'Lab with No Credit') {
      const associatedLabs = scheduledClasses.filter(cls => 
        cls.subject === classToRemove.subject && 
        cls.number === classToRemove.number && 
        cls.type === 'Lab with No Credit'
      )
      classesToRemove.push(...associatedLabs.map(lab => lab.id))
    }
    
    // Remove from local state
    setScheduledClasses(prev => prev.filter(cls => !classesToRemove.includes(cls.id)))
    
    // Remove from persisted schedule if authenticated
    if (isAuthenticated) {
      classesToRemove.forEach(id => removeFromPersistedSchedule(id))
    }
    
    // Remove from Zustand store
    classesToRemove.forEach(id => removeFromSchedule(id))
    
    // Remove calendar events
    setCalendarEvents(prev => prev.filter(event => !classesToRemove.some(id => event.id.startsWith(id))))
  }

  const handleSectionSwitch = (currentClass: ClassData, newSection: ClassData) => {
    // Remove the current section
    setScheduledClasses(prev => prev.filter(cls => cls.id !== currentClass.id))
    setCalendarEvents(prev => prev.filter(event => !event.id.startsWith(currentClass.id)))
    
    // Remove from persisted schedule if authenticated
    if (isAuthenticated) {
      removeFromPersistedSchedule(currentClass.id)
    }
    
    // Find the color of the current class
    const currentScheduledClass = scheduledClasses.find(cls => cls.id === currentClass.id)
    
    // Add the new section with the same color
    const newScheduledClass: ScheduledClass = {
      ...newSection,
      colorBg: currentScheduledClass?.colorBg || classColors[0].bg,
      colorHex: currentScheduledClass?.colorHex || classColors[0].hex
    }
    
    setScheduledClasses(prev => [...prev, newScheduledClass])
    
    // Persist new section if authenticated
    if (isAuthenticated) {
      addToPersistedSchedule({
        ...newSection,
        color: newScheduledClass.colorHex,
        number: newSection.number || '',
      } as any)
    }
    
    // Add calendar events for new section
    const newEvents = parseTimeToEvents(newScheduledClass)
    setCalendarEvents(prev => [...prev, ...newEvents])
  }

  // Handle lab switching
  const handleLabSwitch = (currentLabClass: ClassData, newLabSection: ClassData) => {
    handleSectionSwitch(currentLabClass, newLabSection)
  }

  // Calendar event handlers
  const handleEventAdd = (event: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, event])
  }
  
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setCalendarEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ))
  }
  
  const handleEventDelete = (eventId: string) => {
    // This is for manual calendar events, not class events
    setCalendarEvents(prev => prev.filter(event => event.id !== eventId))
  }

  // Calculate current semester dates for calendar highlighting
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const semesterStart = currentMonth < 5 ? new Date(currentYear, 0, 15) : new Date(currentYear, 7, 20)
  const semesterEnd = currentMonth < 5 ? new Date(currentYear, 4, 15) : new Date(currentYear, 11, 15)

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <CustomNavbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Expanded for Date Picker and Course Ledger */}
        <div className="w-[350px] bg-background flex flex-col">
          {/* Date Picker */}
          <div className="flex justify-center p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                semester: { from: semesterStart, to: semesterEnd }
              }}
              modifiersStyles={{
                semester: { backgroundColor: 'hsl(var(--accent))' }
              }}
            />
          </div>

          {/* Enrolled Classes Ledger */}
          <div className="flex-1 flex flex-col px-4 pb-4">
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {scheduledClasses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">No classes scheduled</p>
                    <p className="text-xs">
                      Add classes from your{" "}
                      <Link href="/dashboard" className="text-primary underline">
                        degree tracker
                      </Link>
                    </p>
                  </div>
                ) : (
                  scheduledClasses.map((cls) => {
                    const groupedClass = groupedClasses.find(g => 
                      g.subject === cls.subject && g.number === cls.number
                    )
                    return (
                      <EnrolledClassCard
                        key={cls.id}
                        classData={cls}
                        onRemove={() => handleRemoveFromSchedule(cls.id)}
                        onSwitchSection={(newSection) => handleSectionSwitch(cls, newSection)}
                        availableSections={groupedClass?.sections}
                        availableLabSections={groupedClass?.labSections}
                      />
                    )
                  })
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="pt-3 mt-3 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse & Add Classes
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <FileDown className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar - EventCalendar already has the pills */}
          <div className="flex-1 p-4 overflow-auto">
            <EventCalendar
              events={calendarEvents}
              onEventAdd={handleEventAdd}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
              initialView="week"
              className="h-full"
              scheduledClasses={scheduledClasses}
              totalCredits={totalCredits}
              isSaving={isSaving}
              groupedClasses={groupedClasses}
              onRemoveFromSchedule={handleRemoveFromSchedule}
              onLabSwitch={handleLabSwitch}
            />
          </div>
        </div>
      </div>
    </div>
  )
}