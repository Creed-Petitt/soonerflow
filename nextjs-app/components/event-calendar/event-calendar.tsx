"use client"

import { useState } from "react"
import {
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subWeeks,
} from "date-fns"
import { useSchedule } from "@/contexts/schedule-context"
import { toast } from "sonner"

import { EventGap, EventHeight, WeekCellsHeight } from "@/components/event-calendar/constants"
import { addHoursToDate } from "@/components/event-calendar/utils"
import { TimeGridView } from "@/components/event-calendar/time-grid-view"
import { EventDialog } from "@/components/event-calendar/event-dialog"
import type { CalendarEvent, CalendarView } from "@/components/event-calendar/types"
import { CalendarSkeleton } from "@/components/ui/calendar-skeleton"

export interface EventCalendarProps {
  events?: CalendarEvent[]
  onEventAdd?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
  onEventSelect?: (event: CalendarEvent) => void
  className?: string
  initialView?: CalendarView
  currentDate?: Date
  onDateChange?: (date: Date) => void
  scheduledClasses?: any[]
  totalCredits?: number
  isLoading?: boolean
  groupedClasses?: any[]
  onRemoveFromSchedule?: (id: string) => void
  onLabSwitch?: (currentLab: any, newLab: any) => void
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onEventSelect,
  currentDate: externalDate,
  onDateChange,
  isLoading = false,
}: EventCalendarProps) {
  const { currentSemester, availableSemesters } = useSchedule()
  
  const [internalDate, setInternalDate] = useState(new Date())
  const currentDate = externalDate || internalDate
  const setCurrentDate = (date: Date) => {
    if (onDateChange) {
      onDateChange(date)
    } else {
      setInternalDate(date)
    }
  }
  // Force week view only - no view switching
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  // Get current semester details
  const currentSemesterDetails = availableSemesters.find(
    sem => sem.code === currentSemester
  )

  // Removed keyboard shortcuts - calendar is now week-only

  const handlePrevious = () => {
    // Week view only
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    // Week view only
    setCurrentDate(addWeeks(currentDate, 1))
  }


  const handleEventSelect = (event: CalendarEvent) => {
    
    // Use custom event handler if provided, otherwise fallback to default dialog
    if (onEventSelect) {
      onEventSelect(event)
    } else {
      setSelectedEvent(event)
      setIsEventDialogOpen(true)
    }
  }

  const handleEventCreate = (startTime: Date) => {

    // Snap to 15-minute intervals
    const minutes = startTime.getMinutes()
    const remainder = minutes % 15
    if (remainder !== 0) {
      if (remainder < 7.5) {
        // Round down to nearest 15 min
        startTime.setMinutes(minutes - remainder)
      } else {
        // Round up to nearest 15 min
        startTime.setMinutes(minutes + (15 - remainder))
      }
      startTime.setSeconds(0)
      startTime.setMilliseconds(0)
    }

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: startTime,
      end: addHoursToDate(startTime, 1),
      allDay: false,
    }
    setSelectedEvent(newEvent)
    setIsEventDialogOpen(true)
  }

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      onEventUpdate?.(event)
      // Show toast notification when an event is updated
      toast(`Event "${event.title}" updated`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      })
    } else {
      onEventAdd?.({
        ...event,
        id: Math.random().toString(36).substring(2, 11),
      })
      // Show toast notification when an event is added
      toast(`Event "${event.title}" added`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      })
    }
    setIsEventDialogOpen(false)
    setSelectedEvent(null)
  }

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId)
    onEventDelete?.(eventId)
    setIsEventDialogOpen(false)
    setSelectedEvent(null)

    // Show toast notification when an event is deleted
    if (deletedEvent) {
      toast(`Event "${deletedEvent.title}" deleted`, {
        description: format(new Date(deletedEvent.start), "MMM d, yyyy"),
        position: "bottom-left",
      })
    }
  }

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent)

    // Show toast notification when an event is updated via drag and drop
    toast(`Event "${updatedEvent.title}" moved`, {
      description: format(new Date(updatedEvent.start), "MMM d, yyyy"),
      position: "bottom-left",
    })
  }

  const viewTitle = (() => {
    // Show semester name instead of month/year navigation
    const semesterName = currentSemesterDetails?.name || currentSemester;
    
    // Since view is always "week", we only need this logic
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    if (isSameMonth(start, end)) {
      return `${semesterName} - ${format(start, "MMMM d")}`;
    } else {
      return `${semesterName} - ${format(start, "MMM d")} - ${format(end, "MMM d")}`;
    }
  })();

  return (
    <div
      className="flex flex-col h-full has-data-[slot=month-view]:flex-1"
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <>
          {/* Removed view selector and new event controls - calendar is now week-only */}

          <div className="flex flex-1 flex-col">
            {/* Always show week view - removed other views */}
            <TimeGridView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={() => {}} // Disabled event creation
              days={5} // Only show weekdays
            />
          </div>

          <EventDialog
            event={selectedEvent}
            isOpen={isEventDialogOpen}
            onClose={() => {
              setIsEventDialogOpen(false)
              setSelectedEvent(null)
            }}
            onSave={handleEventSave}
            onDelete={handleEventDelete}
          />
        </>
      )}
    </div>
  )
}
