"use client"

import * as React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, AlertTriangle, Check, ChevronDown } from "lucide-react"

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
  type?: string
}

interface LabSwitchingDropdownProps {
  lectureClass: ClassData
  currentLabClass: ClassData
  availableLabSections: ClassData[]
  scheduledClasses: ClassData[]
  onSwitchLab: (newLabSection: ClassData) => void
  children: React.ReactNode
}

// Time conflict detection utility (simplified version)
const checkTimeConflict = (class1: ClassData, class2: ClassData, excludeId?: string): boolean => {
  if (!class1.time || !class2.time || class1.time === 'TBA' || class2.time === 'TBA') {
    return false
  }

  // Don't check conflict with self or the class being replaced
  if (class1.id === class2.id || class1.id === excludeId || class2.id === excludeId) {
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
      
      return hour * 60 + min
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

  // Check time overlap
  return !(time1.endMinutes <= time2.startMinutes || time2.endMinutes <= time1.startMinutes)
}

// Get seat availability status
const getSeatStatus = (availableSeats?: number, totalSeats?: number) => {
  if (availableSeats === undefined || totalSeats === undefined) {
    return { status: 'unknown', text: 'TBA', color: 'text-muted-foreground' }
  }
  
  if (availableSeats === 0) {
    return { status: 'full', text: 'Full', color: 'text-red-600' }
  } else if (availableSeats <= 5) {
    return { status: 'limited', text: 'Limited', color: 'text-yellow-600' }
  } else {
    return { status: 'open', text: 'Open', color: 'text-green-600' }
  }
}

export function LabSwitchingDropdown({ 
  lectureClass,
  currentLabClass, 
  availableLabSections, 
  scheduledClasses,
  onSwitchLab,
  children 
}: LabSwitchingDropdownProps) {
  const [open, setOpen] = React.useState(false)

  // Analyze lab sections for conflicts and availability
  const analyzedLabs = React.useMemo(() => {
    return availableLabSections
      .filter(lab => lab.id !== currentLabClass.id) // Exclude current lab
      .map(lab => {
        const conflicts = scheduledClasses.filter(scheduled => 
          checkTimeConflict(lab, scheduled, currentLabClass.id) // Exclude current lab from conflict check
        )
        const seatStatus = getSeatStatus(lab.available_seats, lab.total_seats)
        
        return {
          ...lab,
          hasConflict: conflicts.length > 0,
          conflictsWith: conflicts,
          seatStatus,
          isSameInstructor: lab.instructor === lectureClass.instructor
        }
      })
  }, [availableLabSections, scheduledClasses, currentLabClass.id, lectureClass.instructor])

  // Sort labs: no conflicts first, then by availability, then by same instructor
  const sortedLabs = React.useMemo(() => {
    return [...analyzedLabs].sort((a, b) => {
      // Prioritize labs without conflicts
      if (a.hasConflict !== b.hasConflict) {
        return a.hasConflict ? 1 : -1
      }

      // Prioritize labs with available seats
      if (a.seatStatus.status !== b.seatStatus.status) {
        const statusOrder = { 'open': 0, 'limited': 1, 'full': 2, 'unknown': 3 }
        return statusOrder[a.seatStatus.status] - statusOrder[b.seatStatus.status]
      }

      // Prefer same instructor
      if (a.isSameInstructor !== b.isSameInstructor) {
        return a.isSameInstructor ? -1 : 1
      }

      // Sort by available seats (descending)
      return (b.available_seats || 0) - (a.available_seats || 0)
    })
  }, [analyzedLabs])

  const handleLabSwitch = (newLabSection: ClassData) => {
    onSwitchLab(newLabSection)
    setOpen(false)
  }

  if (sortedLabs.length === 0) {
    return <>{children}</>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start" 
        side="bottom" 
        sideOffset={8}
        container={typeof document !== 'undefined' ? document.querySelector('[data-scroll-container="class-list"]') : undefined}
      >
        <div className="p-3 border-b">
          <div className="font-medium text-sm">Switch Lab Section</div>
          <div className="text-xs text-muted-foreground">
            Current: {currentLabClass.time} ({currentLabClass.available_seats}/{currentLabClass.total_seats} seats)
          </div>
        </div>
        <Command>
          <CommandList className="max-h-96">
            <CommandEmpty>No other lab sections available.</CommandEmpty>
            <CommandGroup>
              {sortedLabs.map((lab) => (
                <CommandItem
                  key={lab.id}
                  value={lab.id}
                  onSelect={() => handleLabSwitch(lab)}
                  className={`${
                    lab.hasConflict
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                  disabled={lab.hasConflict}
                >
                  <div className="flex flex-col items-start w-full gap-1">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{lab.time}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            lab.seatStatus.status === 'open' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : lab.seatStatus.status === 'limited'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : lab.seatStatus.status === 'full'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {lab.seatStatus.text}
                        </Badge>
                        {lab.isSameInstructor && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Same Instructor
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lab.instructor} • {lab.location} • {lab.available_seats || 0}/{lab.total_seats || 0} seats
                    </div>
                    {lab.hasConflict && (
                      <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        Conflicts with {lab.conflictsWith.map(c => `${c.subject} ${c.number}`).join(', ')}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}