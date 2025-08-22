"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, GraduationCap, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AcademicCalendarModalProps {
  isOpen: boolean
  onClose: () => void
}

// Hardcoded academic calendar data for Fall 2025
const calendarEvents = {
  fall2025: [
    // Registration & Enrollment
    { date: "Mar 31 - Apr 25", event: "Advance Registration", category: "registration", icon: Clock },
    { date: "Apr 28 - Aug 24", event: "Continuing Registration and Add/Drop", category: "registration", icon: Clock },
    { date: "Aug 24", event: "Last Day to Register Before Classes", category: "registration", icon: Clock },
    { date: "Aug 24", event: "Cancellation Deadline (no grade record)", category: "registration", icon: Clock },
    
    // Semester Start
    { date: "Aug 25", event: "CLASSES BEGIN", category: "important", icon: Calendar },
    { date: "Aug 29", event: "Last Day to Add without Instructor Permission", category: "deadline", icon: Clock },
    
    // Holidays
    { date: "Sept 1", event: "Labor Day Holiday", category: "holiday", icon: Calendar },
    { date: "Nov 26-30", event: "Thanksgiving Vacation", category: "holiday", icon: Calendar },
    
    // Drop/Withdraw Deadlines
    { date: "Sept 8", event: "Last Day to Drop without W", category: "deadline", icon: XCircle },
    { date: "Sept 8", event: "Last Day for 100% Refund on Drops", category: "deadline", icon: XCircle },
    { date: "Nov 14", event: "Last Day to Drop with W (Undergrad)", category: "deadline", icon: XCircle },
    
    // Academic Milestones
    { date: "Oct 6-21", event: "Midterm Grades", category: "academic", icon: Clock },
    { date: "Oct 20", event: "Advance Registration for Spring Begins", category: "registration", icon: Clock },
    
    // Finals & Graduation
    { date: "Dec 7-14", event: "Final Exam Preparation Period", category: "finals", icon: GraduationCap },
    { date: "Dec 12", event: "Last Day of Classes", category: "important", icon: Calendar },
    { date: "Dec 15-19", event: "FINAL EXAMINATIONS", category: "finals", icon: GraduationCap },
    { date: "Dec 23", event: "Final Grades Due", category: "academic", icon: Clock },
    
    // Important Deadlines
    { date: "May 1", event: "Graduation Application Deadline", category: "graduation", icon: GraduationCap },
    { date: "Dec 19", event: "Complete Work for Graduation", category: "graduation", icon: GraduationCap },
  ]
}

const categoryColors = {
  registration: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  important: "bg-red-500/10 text-red-500 border-red-500/20",
  holiday: "bg-green-500/10 text-green-500 border-green-500/20",
  deadline: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  academic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  finals: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  graduation: "bg-pink-500/10 text-pink-500 border-pink-500/20",
}

const categoryLabels = {
  registration: "Registration",
  important: "Important",
  holiday: "Holiday",
  deadline: "Deadline",
  academic: "Academic",
  finals: "Finals",
  graduation: "Graduation",
}

export function AcademicCalendarModal({ isOpen, onClose }: AcademicCalendarModalProps) {
  const events = calendarEvents.fall2025

  // Group events by category for better organization
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = []
    }
    acc[event.category].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-zinc-900 border-zinc-800 p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fall 2025 Academic Calendar
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="max-h-[60vh] px-6 [&>[data-radix-scroll-area-scrollbar]]:bg-transparent [&>[data-radix-scroll-area-scrollbar]]:border-none [&>[data-radix-scroll-area-thumb]]:bg-white/10 [&>[data-radix-scroll-area-thumb]]:rounded [&>[data-radix-scroll-area-thumb]]:border-none hover:[&>[data-radix-scroll-area-thumb]]:bg-white/20">
          <div className="space-y-6 pb-2">
            {/* Important dates first */}
            {['important', 'finals', 'deadline', 'registration', 'academic', 'holiday', 'graduation'].map(category => {
              const categoryEvents = groupedEvents[category]
              if (!categoryEvents || categoryEvents.length === 0) return null
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className={categoryColors[category]}>
                      {categoryLabels[category]}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryEvents.map((event, idx) => {
                      const Icon = event.icon
                      return (
                        <div
                          key={`${category}-${idx}`}
                          className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium">{event.event}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {event.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        
        <div className="text-xs text-muted-foreground p-6 pt-4 border-t border-zinc-800">
          * Calendar is subject to change. For the most current information, check with the registrar's office.
        </div>
      </DialogContent>
    </Dialog>
  )
}