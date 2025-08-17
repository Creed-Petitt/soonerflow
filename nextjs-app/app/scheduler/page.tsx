"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar/event-calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SemesterPicker } from "@/components/semester-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import CustomNavbar from "@/components/custom-navbar"
import { 
  X, 
  FileDown, 
  Printer, 
  BookOpen, 
  GraduationCap
} from "lucide-react"
import { ClassBrowserPanel } from "@/components/class-browser-panel"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
import { useSchedule } from "@/hooks/use-schedule"
// Removed useCourseStore - using local state instead
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  availableLabSections,
  showRemoveButton = true,
  onClick,
  isCurrentSemester = true
}: { 
  classData: ScheduledClass
  onRemove: () => void
  onSwitchSection?: (newSection: ClassData) => void
  availableSections?: ClassData[]
  availableLabSections?: ClassData[]
  showRemoveButton?: boolean
  onClick?: () => void
  isCurrentSemester?: boolean
}) {
  const hasMultipleSections = (availableSections && availableSections.length > 1) || 
                              (classData.type === 'Lab with No Credit' && availableLabSections && availableLabSections.length > 1)
  
  // Only show completed checkmark for historical semesters, not current/future ones
  const isCompleted = (classData.instructor === 'Completed' || classData.type === 'Completed Course') && !isCurrentSemester
  
  return (
    <Card 
      className="p-2 relative group hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      {/* Color indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${classData.colorBg} rounded-l`} />
      
      <div className="pl-2">
        {/* Header with course code and remove button */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{classData.subject} {classData.number}</span>
              {isCompleted && <span className="text-xs text-green-600">✓</span>}
            </div>
            {/* Course title */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {classData.title}
            </p>
          </div>
          
          {/* Remove button - only show for current semester */}
          {showRemoveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function SchedulerPage() {
  const router = useRouter()
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  
  // Use the schedule hook for persistent storage
  const {
    scheduledClasses: persistedClasses,
    addClass: addToPersistedSchedule,
    removeClass: removeFromPersistedSchedule,
    isAuthenticated,
    isSaving,
    loading: scheduleLoading,
    currentSemester,
  } = useSchedule()
  
  // Detect if this is the current semester (for interactive vs read-only mode)
  const getCurrentSemesterCode = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    if (month >= 1 && month <= 5) {
      // Spring semester (January - May)
      return `${year - 1}20`; // Spring 2025 = 202420
    } else if (month >= 8 && month <= 12) {
      // Fall semester (August - December)  
      return `${year}10`; // Fall 2025 = 202510
    } else {
      // Summer semester (June - July)
      return `${year - 1}30`; // Summer 2025 = 202430
    }
  };
  
  const currentSemesterCode = getCurrentSemesterCode();
  const isCurrentSemester = currentSemester === currentSemesterCode;
  const isFutureSemester = currentSemester > currentSemesterCode;
  const isPastSemester = currentSemester < currentSemesterCode;
  
  // For calendar purposes, only current and future semesters are interactive
  const isInteractiveSemester = isCurrentSemester || isFutureSemester
  
  // Calculate semester dates based on current semester
  const getSemesterDates = () => {
    const year = parseInt(currentSemester.substring(0, 4))
    const term = currentSemester.substring(4)
    
    if (term === '10') {
      // Fall semester (August - December)
      return {
        start: new Date(year, 7, 20),  // August 20
        end: new Date(year, 11, 15)    // December 15
      }
    } else if (term === '20') {
      // Spring semester (January - May)
      return {
        start: new Date(year + 1, 0, 15),  // January 15
        end: new Date(year + 1, 4, 15)     // May 15
      }
    } else {
      // Summer semester (June - August)
      return {
        start: new Date(year + 1, 5, 1),   // June 1
        end: new Date(year + 1, 7, 10)     // August 10
      }
    }
  }
  
  // Set calendar to show the week containing the semester start date
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Always start with the semester start date 
    const semesterDates = getSemesterDates()
    return semesterDates.start
  })
  
  // Update calendar date when semester changes
  useEffect(() => {
    const semesterDates = getSemesterDates()
    setSelectedDate(semesterDates.start)
  }, [currentSemester])
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])
  const [isClassBrowserOpen, setIsClassBrowserOpen] = useState(false)
  
  // Class detail modal state
  const [showClassDetailModal, setShowClassDetailModal] = useState(false)
  const [classDetailData, setClassDetailData] = useState<any>(null)
  const [originalScheduledClass, setOriginalScheduledClass] = useState<any>(null)
  
  // Debug logging
  console.log('🔍 Scheduler Debug:')
  console.log('  Current semester:', currentSemester)
  console.log('  Persisted classes:', persistedClasses?.length || 0)
  console.log('  Schedule loading:', scheduleLoading)
  console.log('  Is authenticated:', isAuthenticated)
  
  // Map persisted classes with colors for display
  const scheduledClasses = useMemo(() => {
    return persistedClasses.map((cls: any, index: number) => ({
      ...cls,
      number: cls.number || cls.courseNumber,
      colorBg: classColors[index % classColors.length].bg,
      colorHex: cls.color || classColors[index % classColors.length].hex,
    }))
  }, [persistedClasses])
  
  // Credit tracking
  const totalCredits = scheduledClasses.reduce((sum, cls) => sum + (cls.credits || 3), 0)
  const creditLimit = 21
  
  // Generate calendar events from scheduled classes
  useEffect(() => {
    console.log('='.repeat(60))
    console.log('🔄 CALENDAR EVENTS GENERATION TRIGGERED')
    console.log('  Current semester:', currentSemester)
    console.log('  Scheduled classes count:', scheduledClasses?.length || 0)
    console.log('  Scheduled classes data:', scheduledClasses)
    
    const allEvents: CalendarEvent[] = []
    
    if (scheduledClasses && scheduledClasses.length > 0) {
      scheduledClasses.forEach((cls, index) => {
        console.log(`\n--- Processing class ${index + 1}/${scheduledClasses.length}: ${cls.subject} ${cls.number} (${cls.id}) ---`)
        const events = parseTimeToEvents(cls)
        console.log(`    ✅ Generated ${events.length} events for ${cls.subject} ${cls.number}`)
        allEvents.push(...events)
      })
    } else {
      console.log('  ⚠️ No scheduled classes to process')
    }
    
    console.log('\n📅 FINAL SUMMARY:')
    console.log('📅 Total calendar events created:', allEvents.length)
    console.log('📅 Events by class:', allEvents.reduce((acc, event) => {
      const classKey = event.title
      acc[classKey] = (acc[classKey] || 0) + 1
      return acc
    }, {} as Record<string, number>))
    
    setCalendarEvents(allEvents)
    console.log('='.repeat(60))
  }, [scheduledClasses])
  

  // Memoize subjects to prevent unnecessary API calls
  const subjects = useMemo(() => {
    return [...new Set(scheduledClasses.map(cls => cls.subject))]
  }, [scheduledClasses])

  // Load grouped classes for section switching with caching
  useEffect(() => {
    if (subjects.length === 0) return

    let cancelled = false
    
    const loadGroupedClasses = async () => {
      try {
        // Load classes for each subject
        const allClasses: ClassData[] = []
        for (const subject of subjects) {
          if (cancelled) return
          
          const response = await fetch(`/api/classes?subject=${subject}&semester=${currentSemester}&limit=500`)
          if (response.ok && !cancelled) {
            const data = await response.json()
            allClasses.push(...(data.classes || []))
          }
        }
        
        if (!cancelled) {
          // Group classes
          const grouped = groupClasses(allClasses)
          setGroupedClasses(grouped)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading grouped classes:', error)
        }
      }
    }

    loadGroupedClasses()
    
    return () => {
      cancelled = true
    }
  }, [subjects]) // Only re-run when subjects actually change

  const parseTimeToEvents = (classData: ScheduledClass) => {
    console.log('🕐 Creating template events for:', classData.subject, classData.number, 'Time:', classData.time)
    
    // Handle classes with no time data
    if (!classData.time || classData.time === 'TBA' || classData.time.trim() === '') {
      const isCompleted = classData.instructor === 'Completed' || classData.type === 'Completed Course'
      const templateDate = new Date(2025, 0, 6) // Monday Jan 6, 2025
      templateDate.setHours(9, 0, 0, 0)
      
      const endDate = new Date(templateDate)
      endDate.setHours(10, 30, 0, 0)
      
      return [{
        id: `${classData.id}-template`,
        title: isCompleted ? `✓ ${classData.subject} ${classData.number}` : `${classData.subject} ${classData.number}`,
        description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location || 'TBA'}`,
        start: templateDate,
        end: endDate,
        color: isCompleted ? 'emerald' : 'gray',
        location: classData.location || 'TBA',
        allDay: false
      }]
    }
    
    // Parse "MWF 10:00 am-10:50 am" format
    const parts = classData.time.split(' ')
    if (parts.length < 3) return []
    
    const days = parts[0]
    const timeRange = parts.slice(1).join(' ')
    const [startTimeStr, endTimeStr] = timeRange.split('-')
    
    // Parse time function
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
    
    // Map day letters to template dates
    const templateDates: { [key: string]: Date } = {
      'M': new Date(2025, 0, 6),  // Monday Jan 6, 2025
      'T': new Date(2025, 0, 7),  // Tuesday Jan 7, 2025  
      'W': new Date(2025, 0, 8),  // Wednesday Jan 8, 2025
      'R': new Date(2025, 0, 9),  // Thursday Jan 9, 2025
      'F': new Date(2025, 0, 10), // Friday Jan 10, 2025
    }
    
    // Parse days string
    const classDays = []
    let i = 0
    while (i < days.length) {
      if (i < days.length - 1 && days.slice(i, i + 2) === 'Th') {
        classDays.push('R') // Thursday
        i += 2
      } else if (days[i] === 'R') {
        classDays.push('R') // Thursday
        i++
      } else if (templateDates[days[i]]) {
        classDays.push(days[i])
        i++
      } else {
        i++
      }
    }
    
    console.log(`🕐 Template days for ${classData.subject} ${classData.number}:`, classDays)
    
    // Create one template event per day
    const events = classDays.map(dayLetter => {
      const templateDate = new Date(templateDates[dayLetter])
      templateDate.setHours(startTime.hour, startTime.min, 0, 0)
      
      const endDate = new Date(templateDate)
      endDate.setHours(endTime.hour, endTime.min, 0, 0)
      
      return {
        id: `${classData.id}-${dayLetter}`,
        title: `${classData.subject} ${classData.number}`,
        description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location}`,
        start: templateDate,
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
      }
    })
    
    console.log(`✅ Created ${events.length} template events for ${classData.subject} ${classData.number}`)
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
    
    // Remove from persisted schedule
    classesToRemove.forEach(id => removeFromPersistedSchedule(id))
    
    // Remove calendar events
    setCalendarEvents(prev => prev.filter(event => !classesToRemove.some(id => event.id.startsWith(id))))
  }

  const handleSectionSwitch = (currentClass: ClassData, newSection: ClassData) => {
    // Remove the current section
    removeFromPersistedSchedule(currentClass.id)
    
    // Add the new section
    addToPersistedSchedule({
      ...newSection,
      color: scheduledClasses.find(cls => cls.id === currentClass.id)?.colorHex || classColors[0].hex,
      number: newSection.number || '',
    } as any)
  }

  // Handle lab switching
  const handleLabSwitch = (currentLabClass: ClassData, newLabSection: ClassData) => {
    handleSectionSwitch(currentLabClass, newLabSection)
  }

  // Calendar event handlers
  const handleEventSelect = async (event: CalendarEvent) => {
    console.log('🎯 handleEventSelect called with:', event)
    console.log('🎯 Event ID:', event.id)
    console.log('🎯 Available scheduled classes:', scheduledClasses.map(c => ({ id: c.id, subject: c.subject, number: c.number })))
    
    // Find the scheduled class that corresponds to this calendar event
    const classId = event.id.split('-')[0] // Extract class ID from event ID
    console.log('🎯 Extracted class ID:', classId)
    
    const scheduledClass = scheduledClasses.find(cls => cls.id === classId)
    console.log('🎯 Found scheduled class:', scheduledClass)
    
    if (!scheduledClass) {
      console.log('❌ No scheduled class found for event:', event.id)
      console.log('❌ Available class IDs:', scheduledClasses.map(c => c.id))
      return
    }
    
    console.log('✅ Opening ClassDetailModal for:', scheduledClass.subject, scheduledClass.number)
    // Open ClassDetailDialog for this scheduled class
    await openClassDetailModal(scheduledClass)
  }
  
  const openClassDetailModal = async (scheduledClass: ScheduledClass) => {
    try {
      console.log('🚀 openClassDetailModal called with:', scheduledClass)
      setOriginalScheduledClass(scheduledClass)
      setShowClassDetailModal(true)
      setClassDetailData(null) // Start with loading state
      
      console.log(`📡 Fetching sections for ${scheduledClass.subject} ${scheduledClass.number}`)
      
      // Fetch all available sections for this course
      const apiUrl = `/api/classes?subject=${scheduledClass.subject}&search=${scheduledClass.number}&semester=${currentSemester}&limit=50`
      console.log('📡 API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📡 API Response data:', data)
        const allClasses = data.classes || []
        
        // Filter to get exact course sections
        const classes = allClasses.filter((c: any) => 
          c.subject === scheduledClass.subject && c.number === scheduledClass.number
        )
        
        console.log('📡 Filtered classes:', classes.length)
        
        if (classes.length > 0) {
          // Group sections by course
          const groupedClass = {
            subject: scheduledClass.subject,
            number: scheduledClass.number,
            title: classes[0].title || scheduledClass.title,
            credits: classes[0].credits || scheduledClass.credits,
            sections: classes.filter((c: any) => c.type !== 'Lab with No Credit'),
            labSections: classes.filter((c: any) => c.type === 'Lab with No Credit')
          }
          
          // Find the currently scheduled section
          const currentSection = classes.find((c: any) => c.id === scheduledClass.id) || classes[0]
          console.log('📡 Current section found:', currentSection?.id)
          
          setClassDetailData({
            groupedClass,
            selectedSection: currentSection,
            isChangeMode: true // This indicates we're changing, not adding
          })
          console.log('✅ Modal data set successfully')
        } else {
          console.log('❌ No sections found for course:', `${scheduledClass.subject} ${scheduledClass.number}`)
          setShowClassDetailModal(false)
        }
      } else {
        console.log('❌ API request failed:', response.status)
        setShowClassDetailModal(false)
      }
    } catch (error) {
      console.error('❌ Error opening class detail modal:', error)
      setShowClassDetailModal(false)
    }
  }
  
  const semesterDates = getSemesterDates()

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <CustomNavbar />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Expanded for Date Picker and Course Ledger */}
        <div className="w-[350px] bg-background flex flex-col overflow-y-auto">
          {/* Semester Picker */}
          <div className="flex justify-center pt-6 px-4 pb-4 flex-shrink-0">
            <SemesterPicker />
          </div>

          {/* Enrolled Classes Ledger */}
          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
            <div className="relative flex-1 min-h-0">
              <ScrollArea className="h-full">
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
                        showRemoveButton={isInteractiveSemester}
                        onClick={() => openClassDetailModal(cls)}
                        isCurrentSemester={isInteractiveSemester}
                      />
                    )
                  })
                )}
                </div>
              </ScrollArea>
              {/* Subtle gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            {/* Actions */}
            <div className="pt-3 mt-3 space-y-2 flex-shrink-0">
              {isInteractiveSemester ? (
                // Current or future semester: Show interactive controls
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsClassBrowserOpen(true)}
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
                </>
              ) : (
                // Past semester: Show read-only message and export only
                <>
                  <div className="text-center py-3 px-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">📚 Historical View</p>
                    <p className="text-xs text-muted-foreground">
                      Past semester - read only
                    </p>
                  </div>
                  
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar - EventCalendar already has the pills */}
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
            <EventCalendar
              events={calendarEvents}
              onEventSelect={handleEventSelect}
              initialView="week"
              currentDate={selectedDate}
              onDateChange={setSelectedDate}
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
      
      {/* Class Browser Panel - only for current and future semesters */}
      {isInteractiveSemester && (
        <ClassBrowserPanel
          isOpen={isClassBrowserOpen}
          onClose={() => setIsClassBrowserOpen(false)}
        />
      )}
      
      {/* Class Detail Modal */}
      {showClassDetailModal && classDetailData && (
        <ClassDetailDialog
          isOpen={showClassDetailModal}
          onClose={() => {
            setShowClassDetailModal(false)
            setClassDetailData(null)
            setOriginalScheduledClass(null)
          }}
          groupedClass={classDetailData.groupedClass}
          selectedSection={classDetailData.selectedSection}
          isChangeMode={classDetailData.isChangeMode}
          onAddToSchedule={(newSection, newLabSection) => {
            // This will be handled by the enhanced ClassDetailDialog
            // which will determine if this is an add or change operation
            if (classDetailData.isChangeMode && originalScheduledClass) {
              // Change mode - replace the existing class
              handleSectionSwitch(originalScheduledClass, newSection)
              if (newLabSection) {
                // Handle lab switching if needed
                handleLabSwitch(originalScheduledClass, newLabSection)
              }
            } else {
              // Add mode - add new class (shouldn't happen from calendar)
              console.log('Add mode not supported from calendar')
            }
            
            setShowClassDetailModal(false)
            setClassDetailData(null)
            setOriginalScheduledClass(null)
          }}
        />
      )}
    </div>
  )
}