"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react"

// Custom SVG Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

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

interface LabSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLab: (lectureSection: ClassData, labSection: ClassData) => void
  lectureSection: ClassData
  labSections: ClassData[]
  scheduledClasses: ClassData[]
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

export function LabSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectLab, 
  lectureSection, 
  labSections, 
  scheduledClasses 
}: LabSelectionModalProps) {
  const [selectedLabId, setSelectedLabId] = React.useState<string | null>(null)

  // Analyze lab sections for conflicts and availability
  const analyzedLabs = React.useMemo(() => {
    return labSections.map(lab => {
      const conflicts = scheduledClasses.filter(scheduled => 
        checkTimeConflict(lab, scheduled)
      )
      const seatStatus = getSeatStatus(lab.available_seats, lab.total_seats)
      
      return {
        ...lab,
        hasConflict: conflicts.length > 0,
        conflictsWith: conflicts,
        seatStatus,
        isSameInstructor: lab.instructor === lectureSection.instructor
      }
    })
  }, [labSections, scheduledClasses, lectureSection.instructor])

  // Sort labs: available seats first, same instructor preferred, no conflicts
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

  const handleSelectLab = () => {
    const selectedLab = sortedLabs.find(lab => lab.id === selectedLabId)
    if (selectedLab) {
      onSelectLab(lectureSection, selectedLab)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Select Lab Section for {lectureSection.subject} {lectureSection.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            This lecture requires a co-requisite lab section. Choose one that fits your schedule:
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <div className="space-y-3 pb-4">
          {sortedLabs.map((lab) => (
            <div
              key={lab.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedLabId === lab.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : lab.hasConflict
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
              onClick={() => setSelectedLabId(lab.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono">
                      Section {lab.id.split('-').pop() || lab.id}
                    </Badge>
                    
                    {/* Seat Status Badge */}
                    <Badge 
                      variant="secondary" 
                      className={`${
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

                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{lab.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lab.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{lab.instructor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {(lab.total_seats || 0) - (lab.available_seats || 0)}/{lab.total_seats || 0}, {lab.available_seats || 0} left
                      </span>
                    </div>
                  </div>

                  {/* Conflict Warning */}
                  {lab.hasConflict && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700 dark:text-red-300">
                        <div className="font-medium">Schedule Conflict</div>
                        <div className="text-xs">
                          Conflicts with: {lab.conflictsWith.map(c => `${c.subject} ${c.number}`).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                <div className="ml-4">
                  {selectedLabId === lab.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="flex-shrink-0 bg-background border-t p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelectLab}
            disabled={!selectedLabId}
          >
            Add Lecture + Lab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}