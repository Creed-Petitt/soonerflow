"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar/event-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { MainNavigation } from "@/components/main-navigation"
import { Plus, X, Clock, MapPin, Users, Star, Calendar as CalendarIcon, Settings, ChevronLeft, ChevronRight, ChevronDown, Save } from "lucide-react"
import { ExpandableClassCard } from "@/components/expandable-class-card"
import { GroupedClassCard } from "@/components/grouped-class-card"
import { LabSelectionModal } from "@/components/lab-selection-modal"
import { LabSwitchingDropdown } from "@/components/lab-switching-dropdown"
import { AuthButton } from "@/components/auth-button"
import { useSchedule } from "@/hooks/use-schedule"
import Link from "next/link"

// Removed momentLocalizer as Origin UI calendar handles this internally

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
  type?: string  // ADDED: Class type (Lecture, Lab with No Credit, etc.)
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

// API function
const fetchClasses = async (filters: any = {}): Promise<ClassData[]> => {
  try {
    const params = new URLSearchParams()
    if (filters.subject) params.set('subject', filters.subject)
    if (filters.search) params.set('search', filters.search)
    if (filters.level) params.set('level', filters.level)
    // Only fetch a reasonable number - filtered by subject/search on backend
    params.set('limit', '500')
    
    const url = `http://127.0.0.1:8000/api/classes?${params}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch classes')
    
    const data = await response.json()
    return data.classes || []
  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

// Group classes by subject and number, handling lecture/lab separation using type field
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
      // Add to lab sections
      group.labSections!.push(cls)
    } else {
      // Add to regular sections (lectures, seminars, etc.)
      group.sections.push(cls)
    }
  })
  
  // Filter out groups that only have lab sections (orphaned labs)
  const validGroups = Array.from(groups.values()).filter(group => 
    group.sections.length > 0
  )
  
  return validGroups
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
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use the schedule hook for persistent storage
  const {
    scheduledClasses: persistedClasses,
    addClass: addToPersistedSchedule,
    removeClass: removeFromPersistedSchedule,
    isAuthenticated,
    isSaving,
    loading: scheduleLoading,
  } = useSchedule()
  
  // Local scheduled classes state (includes color info)
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  
  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<string>("")
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [displayLimit, setDisplayLimit] = useState(50)
  
  // Lab selection modal state
  const [labModalOpen, setLabModalOpen] = useState(false)
  const [pendingLectureSection, setPendingLectureSection] = useState<ClassData | null>(null)
  const [pendingLabSections, setPendingLabSections] = useState<ClassData[]>([])
  
  // Credit tracking
  const totalCredits = scheduledClasses.reduce((sum, cls) => sum + (cls.credits || 3), 0)
  
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
      
      // Generate calendar events for the restored classes
      const allEvents: CalendarEvent[] = []
      mappedClasses.forEach(cls => {
        const events = parseTimeToEvents(cls)
        allEvents.push(...events)
      })
      setCalendarEvents(allEvents)
    }
  }, [persistedClasses, scheduleLoading])
  const creditLimit = 21 // Standard semester limit
  const isOverLimit = totalCredits > creditLimit
  
  // Filtered grouped classes (Department and Course Level only)
  const filteredGroupedClasses = groupedClasses.filter(group => {
    // Filter by subject
    const matchesSubject = !selectedSubject || selectedSubject === "all" || group.subject === selectedSubject
    
    // Filter by course level
    const courseNum = parseInt(group.number)
    const matchesCourseLevel = !selectedCourseLevel || selectedCourseLevel === "" || selectedCourseLevel === "all" ||
      (selectedCourseLevel === "1000" && courseNum >= 1000 && courseNum < 2000) ||
      (selectedCourseLevel === "2000" && courseNum >= 2000 && courseNum < 3000) ||
      (selectedCourseLevel === "3000" && courseNum >= 3000 && courseNum < 4000) ||
      (selectedCourseLevel === "4000" && courseNum >= 4000 && courseNum < 5000) ||
      (selectedCourseLevel === "5000+" && courseNum >= 5000)
    
    return matchesSubject && matchesCourseLevel
  })

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50)
  }, [selectedSubject, selectedCourseLevel])

  // Load initial subjects list
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // Load subjects list
        const response = await fetch('http://127.0.0.1:8000/api/classes?limit=200')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const subjects = data.filters?.departments || []
        setAvailableSubjects(subjects)
      } catch (error) {
        console.error('Failed to load subjects:', error)
        setAvailableSubjects(['CS', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'ENGL', 'HIST'])
      }
      setLoading(false)
    }
    
    loadInitialData()
  }, [])

  // Load classes based on selected filters
  useEffect(() => {
    const loadFilteredData = async () => {
      // Only load if we have a subject selected
      if (!selectedSubject || selectedSubject === "all") {
        setClasses([])
        setGroupedClasses([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Load classes for selected subject
        const filters = { subject: selectedSubject }
        const classesData = await fetchClasses(filters)
        
        setClasses(classesData)
        
        // Group classes by subject and number
        const grouped = groupClasses(classesData)
        setGroupedClasses(grouped)
      } catch (error) {
        console.error('Failed to load classes:', error)
      }
      setLoading(false)
    }
    
    const timeoutId = setTimeout(loadFilteredData, 100)
    return () => clearTimeout(timeoutId)
  }, [selectedSubject])

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
          description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location}`,
          start: startDate,
          end: endDate,
          color: classData.colorHex === '#3b82f6' ? 'sky' : 
                 classData.colorHex === '#10b981' ? 'emerald' :
                 classData.colorHex === '#8b5cf6' ? 'violet' :
                 classData.colorHex === '#f97316' ? 'orange' :
                 classData.colorHex === '#ec4899' ? 'rose' :
                 classData.colorHex === '#f59e0b' ? 'amber' : 'sky',
          location: classData.location
        })
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7)
      }
    })
    
    return events
  }

  // Time conflict detection utility
  const checkTimeConflict = (class1: ClassData, class2: ClassData): boolean => {
    if (!class1.time || !class2.time || class1.time === 'TBA' || class2.time === 'TBA') {
      return false
    }

    // Parse time format "MWF 10:00 am-10:50 am"
    const parseClassTime = (timeStr: string) => {
      const parts = timeStr.split(' ')
      if (parts.length < 3) return null
      
      const days = parts[0]
      const timeRange = parts.slice(1).join(' ')
      const [startStr, endStr] = timeRange.split('-')
      
      if (!startStr || !endStr) return null
      
      const parseTime = (time: string) => {
        const cleanTime = time.trim()
        const isPM = cleanTime.includes('pm')
        const isAM = cleanTime.includes('am')
        const timeOnly = cleanTime.replace(/[ap]m/g, '').trim()
        const [hourStr, minStr] = timeOnly.split(':')
        let hour = parseInt(hourStr)
        const min = parseInt(minStr) || 0
        
        if (isPM && hour !== 12) hour += 12
        if (isAM && hour === 12) hour = 0
        
        return hour * 60 + min // Convert to minutes for easy comparison
      }
      
      return {
        days,
        startMinutes: parseTime(startStr),
        endMinutes: parseTime(endStr)
      }
    }

    const time1 = parseClassTime(class1.time)
    const time2 = parseClassTime(class2.time)
    
    if (!time1 || !time2) return false

    // Check if days overlap
    const daysOverlap = (days1: string, days2: string): boolean => {
      // Convert day letters to sets for comparison
      const daySet1 = new Set()
      const daySet2 = new Set()
      
      // Handle 'Th' and 'R' for Thursday
      let i = 0
      while (i < days1.length) {
        if (i < days1.length - 1 && days1.slice(i, i + 2) === 'Th') {
          daySet1.add('R')
          i += 2
        } else if (days1[i] === 'R') {
          daySet1.add('R')
          i++
        } else {
          daySet1.add(days1[i])
          i++
        }
      }
      
      i = 0
      while (i < days2.length) {
        if (i < days2.length - 1 && days2.slice(i, i + 2) === 'Th') {
          daySet2.add('R')
          i += 2
        } else if (days2[i] === 'R') {
          daySet2.add('R')
          i++
        } else {
          daySet2.add(days2[i])
          i++
        }
      }
      
      // Check for any common days
      for (const day of daySet1) {
        if (daySet2.has(day)) return true
      }
      return false
    }

    // If no day overlap, no conflict
    if (!daysOverlap(time1.days, time2.days)) {
      return false
    }

    // Check time overlap (classes conflict if one starts before the other ends)
    return !(time1.endMinutes <= time2.startMinutes || time2.endMinutes <= time1.startMinutes)
  }

  // Check for lecture/lab pairs and auto-enrollment
  const findLabOrLectureCompanion = (classData: ClassData): ClassData | null => {
    const baseCode = `${classData.subject} ${classData.number}`
    
    // Look for corresponding lab or lecture in the same grouped class
    const relatedGroup = groupedClasses.find(group => 
      `${group.subject} ${group.number}` === baseCode
    )
    
    if (!relatedGroup || relatedGroup.sections.length <= 1) return null
    
    // Check if this is a lecture looking for lab or vice versa
    const currentTitle = classData.title.toLowerCase()
    const isCurrentLab = currentTitle.includes('lab') || currentTitle.includes('laboratory')
    const isCurrentLecture = currentTitle.includes('lecture') || (!isCurrentLab && classData.credits >= 3)
    
    // Find companion section
    for (const section of relatedGroup.sections) {
      if (section.id === classData.id) continue // Skip self
      
      const sectionTitle = section.title.toLowerCase()
      const isSectionLab = sectionTitle.includes('lab') || sectionTitle.includes('laboratory')
      const isSectionLecture = sectionTitle.includes('lecture') || (!isSectionLab && section.credits >= 3)
      
      // If current is lab, look for lecture; if current is lecture, look for lab
      if ((isCurrentLab && isSectionLecture) || (isCurrentLecture && isSectionLab)) {
        return section
      }
    }
    
    return null
  }

  const addToSchedule = (classData: ClassData) => {
    if (scheduledClasses.find(cls => cls.id === classData.id)) return
    
    // Find the grouped class to check for lab requirements
    const groupedClass = groupedClasses.find(group => 
      `${group.subject} ${group.number}` === `${classData.subject} ${classData.number}`
    )
    
    // Check if this class requires a lab section
    if (groupedClass?.labSections && groupedClass.labSections.length > 0) {
      // Show the lab selection modal
      setPendingLectureSection(classData)
      setPendingLabSections(groupedClass.labSections)
      setLabModalOpen(true)
      return
    }
    
    // No labs required - proceed with normal scheduling
    scheduleClasses([classData])
  }

  // Helper function to actually schedule classes (extracted from old addToSchedule)
  const scheduleClasses = (classesToAdd: ClassData[]) => {
    // Check credit limit for all classes to be added
    const totalNewCredits = classesToAdd.reduce((sum, cls) => sum + (cls.credits || 3), 0)
    const newTotalCredits = totalCredits + totalNewCredits
    if (newTotalCredits > creditLimit) {
      if (!confirm(`Adding ${classesToAdd.length > 1 ? 'these classes' : 'this class'} will put you at ${newTotalCredits} credits, exceeding the recommended limit of ${creditLimit}.\n\nDo you want to continue?`)) {
        return
      }
    }
    
    // Check for time conflicts with existing classes
    const allConflicts = []
    for (const cls of classesToAdd) {
      const conflicts = scheduledClasses.filter(existing => 
        checkTimeConflict(cls, existing)
      )
      if (conflicts.length > 0) {
        allConflicts.push({ class: cls, conflicts })
      }
    }
    
    if (allConflicts.length > 0) {
      const conflictMessage = allConflicts.map(({ class: cls, conflicts }) => 
        `${cls.subject} ${cls.number} conflicts with: ${conflicts.map(c => `${c.subject} ${c.number}`).join(', ')}`
      ).join('\n')
      
      if (!confirm(`Time conflicts detected:\n\n${conflictMessage}\n\nDo you want to add anyway?`)) {
        return
      }
    }
    
    // Add all classes
    for (const cls of classesToAdd) {
      const colorIndex = scheduledClasses.length % classColors.length
      const selectedColor = classColors[colorIndex]
      
      const newScheduledClass: ScheduledClass = {
        ...cls,
        colorBg: selectedColor.bg,
        colorHex: selectedColor.hex
      }
      
      setScheduledClasses(prev => [...prev, newScheduledClass])
      
      // Persist to backend if authenticated
      if (isAuthenticated) {
        addToPersistedSchedule({
          ...cls,
          color: selectedColor.hex,
          number: cls.number || cls.courseNumber || '',
        } as any)
      }
      
      // Add calendar events
      const newEvents = parseTimeToEvents(newScheduledClass)
      setCalendarEvents(prev => [...prev, ...newEvents])
    }
  }

  // Handle lab selection from modal
  const handleLabSelection = (lectureSection: ClassData, labSection: ClassData) => {
    scheduleClasses([lectureSection, labSection])
    setLabModalOpen(false)
    setPendingLectureSection(null)
    setPendingLabSections([])
  }

  // Handle lab switching from dropdown
  const handleLabSwitch = (currentLabClass: ClassData, newLabSection: ClassData) => {
    // Remove the current lab
    setScheduledClasses(prev => prev.filter(cls => cls.id !== currentLabClass.id))
    setCalendarEvents(prev => prev.filter(event => !event.id.startsWith(currentLabClass.id)))
    
    // Remove from persisted schedule if authenticated
    if (isAuthenticated) {
      removeFromPersistedSchedule(currentLabClass.id)
    }
    
    // Add the new lab with the same color as the lecture
    const lectureClass = scheduledClasses.find(cls => 
      cls.subject === currentLabClass.subject && 
      cls.number === currentLabClass.number && 
      cls.type !== 'Lab with No Credit'
    )
    
    if (lectureClass) {
      const newScheduledLab: ScheduledClass = {
        ...newLabSection,
        colorBg: lectureClass.colorBg,
        colorHex: lectureClass.colorHex
      }
      
      setScheduledClasses(prev => [...prev, newScheduledLab])
      
      // Persist new lab to backend if authenticated
      if (isAuthenticated) {
        addToPersistedSchedule({
          ...newLabSection,
          color: lectureClass.colorHex,
          number: newLabSection.number || '',
        } as any)
      }
      
      // Add calendar events for new lab
      const newEvents = parseTimeToEvents(newScheduledLab)
      setCalendarEvents(prev => [...prev, ...newEvents])
    }
  }

  const removeFromSchedule = (classId: string) => {
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
    
    // Remove all classes and their events
    setScheduledClasses(prev => prev.filter(cls => !classesToRemove.includes(cls.id)))
    
    // Remove from persisted schedule if authenticated
    if (isAuthenticated) {
      classesToRemove.forEach(id => removeFromPersistedSchedule(id))
    }
    setCalendarEvents(prev => prev.filter(event => !classesToRemove.some(id => event.id.startsWith(id))))
  }

  // Event handlers for the new calendar
  const handleEventAdd = (event: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, event])
  }
  
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setCalendarEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ))
  }
  
  const handleEventDelete = (eventId: string) => {
    setCalendarEvents(prev => prev.filter(event => event.id !== eventId))
  }


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <MainNavigation />

      {/* Main Content - 2 Panel Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Left Panel - Available Classes (wider width) */}
        <div className="w-[200px] border-r border-border bg-muted/20 flex flex-col">
          {/* Filter Section - Stacked Dropdowns */}
          <div className="p-3 border-b border-border bg-background space-y-2.5" data-filter-section>
            {/* Department Filter */}
            <div>
              <Label className="text-xs font-medium block mb-1.5">Department</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-9 w-full text-sm px-3">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="[&_[role=option]]:!ps-2 [&_[data-slot=select-item]]:!ps-2 min-w-[180px]">
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject} className="text-sm">
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Course Level Filter */}
            <div>
              <Label className="text-xs font-medium block mb-1.5">Level</Label>
              <Select value={selectedCourseLevel} onValueChange={setSelectedCourseLevel}>
                <SelectTrigger className="h-9 w-full text-sm px-3">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="[&_[role=option]]:!ps-2 [&_[data-slot=select-item]]:!ps-2 min-w-[180px] [&_.lucide-check]:hidden">
                  <SelectItem value="all" className="text-sm">All</SelectItem>
                  <SelectItem value="1000" className="text-sm">1000</SelectItem>
                  <SelectItem value="2000" className="text-sm">2000</SelectItem>
                  <SelectItem value="3000" className="text-sm">3000</SelectItem>
                  <SelectItem value="4000" className="text-sm">4000</SelectItem>
                  <SelectItem value="5000+" className="text-sm">5000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Class List */}
          <div className="flex-1 overflow-y-auto px-1 py-0.5 relative [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-button]:hidden scrollbar-thin" data-scroll-container="class-list">
            <div>
              {!selectedSubject && !loading ? (
                // Welcome state - show when no department selected
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">Find Your Classes</div>
                  <div className="text-sm">Select departments to get started</div>
                </div>
              ) : loading && filteredGroupedClasses.length === 0 ? (
                // Loading state - only when no previous results
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-pulse">Loading classes...</div>
                </div>
              ) : filteredGroupedClasses.length === 0 && !loading ? (
                // No results state
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-1">No classes found</div>
                  <div className="text-sm">Try adjusting your filters</div>
                </div>
              ) : (
                // Results - show even while loading to prevent flash
                <>
                  <div className={`space-y-1 ${loading ? 'opacity-75' : ''} pt-1`}>
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
                          scheduledClasses={scheduledClasses}
                        />
                      )
                    })}
                  </div>
                  
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

        {/* Right Panel - Calendar with Header Badges */}
        <div className="flex-1 flex flex-col overflow-y-auto ml-2">
          
          {/* Calendar Section - Full Height */}
          <div className="flex-1 p-2 pt-0 flex flex-col min-h-0">
            {/* Custom Calendar Header */}
            <div className="flex items-center justify-between mb-2 px-2">
              {/* Left Side - Credits and Course Badges */}
              <div className="flex items-center gap-2 flex-1">
                {/* Credits Display */}
                {scheduledClasses.length > 0 && (
                  <div className="text-xs font-medium text-foreground flex items-center py-1 mt-1 -mb-1">
                    {totalCredits} credits
                    {isSaving && (
                      <span className="ml-2 text-muted-foreground flex items-center gap-1">
                        <Save className="h-3 w-3 animate-pulse" />
                        Saving...
                      </span>
                    )}
                    {!isSaving && isAuthenticated && !scheduleLoading && (
                      <span className="ml-2 text-muted-foreground">
                        Saved
                      </span>
                    )}
                  </div>
                )}
                
                {/* Course Badges - Group lectures and labs together */}
                <div className="flex items-center gap-1.5 flex-wrap place-items-center">
                {Object.entries(
                  scheduledClasses.reduce((groups: Record<string, { lecture?: ScheduledClass, lab?: ScheduledClass }>, cls) => {
                    const key = `${cls.subject}-${cls.number}`
                    if (!groups[key]) groups[key] = {}
                    
                    if (cls.type === 'Lab with No Credit') {
                      groups[key].lab = cls
                    } else {
                      groups[key].lecture = cls
                    }
                    return groups
                  }, {})
                ).map(([key, group]) => {
                  const { lecture, lab } = group
                  const displayClass = lecture || lab! // Use lecture as primary, or lab if no lecture
                  
                  // Find related grouped class for lab switching
                  const relatedGroupedClass = groupedClasses.find(gc => 
                    `${gc.subject}-${gc.number}` === key
                  )
                  const availableLabSections = relatedGroupedClass?.labSections || []
                  
                  return (
                    <div
                      key={key}
                      className="group relative inline-flex items-baseline gap-1 px-2 py-1 mt-1 -mb-1 rounded-md text-xs font-medium bg-muted/30 transition-all duration-200 hover:bg-muted/50"
                    >
                      <span className="font-mono font-semibold">
                        {displayClass.subject} {displayClass.number}
                      </span>
                      
                      {/* Lab Switch Button - only show if we have a lab and multiple lab options */}
                      {lab && availableLabSections.length > 1 && (
                        <LabSwitchingDropdown
                          lectureClass={lecture || lab}
                          currentLabClass={lab}
                          availableLabSections={availableLabSections}
                          scheduledClasses={scheduledClasses}
                          onSwitchLab={(newLab) => handleLabSwitch(lab, newLab)}
                        >
                          <button className="opacity-60 hover:opacity-100 transition-opacity">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </LabSwitchingDropdown>
                      )}
                      
                      {/* Remove button */}
                      <X 
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 ml-1 cursor-pointer transition-all duration-200 relative"
                        style={{ top: '1.9px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Remove both lecture and lab if they exist
                          if (lecture) removeFromSchedule(lecture.id)
                          if (lab) removeFromSchedule(lab.id)
                        }}
                      />
                    </div>
                  )
                })}
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <EventCalendar
                events={calendarEvents}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                initialView="week"
                className="h-full"
              />
              
              {/* Empty state overlay */}
              {calendarEvents.length === 0 && (
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

      {/* Lab Selection Modal */}
      {pendingLectureSection && (
        <LabSelectionModal
          isOpen={labModalOpen}
          onClose={() => {
            setLabModalOpen(false)
            setPendingLectureSection(null)
            setPendingLabSections([])
          }}
          onSelectLab={handleLabSelection}
          lectureSection={pendingLectureSection}
          labSections={pendingLabSections}
          scheduledClasses={scheduledClasses}
        />
      )}
    </div>
  )
}