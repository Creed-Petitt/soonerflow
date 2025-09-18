"use client"


import { format, isToday, isTomorrow, addDays } from "date-fns"
import { Calendar, Clock, MapPin, User, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAgendaEventsForDay } from "@/components/event-calendar/utils"
import type { CalendarEvent } from "@/components/event-calendar/types"

interface DashboardCalendarWidgetProps {
  events: CalendarEvent[]
  currentDate?: Date
}

export function DashboardCalendarWidget({ 
  events, 
  currentDate = new Date() 
}: DashboardCalendarWidgetProps) {
  
  // Get today's events first, then tomorrow's if today is empty
  const { displayDate, displayEvents, dayLabel } = (() => {
    const today = new Date(currentDate)
    const tomorrow = addDays(today, 1)
    
    const todayEvents = getAgendaEventsForDay(events, today)
    
    if (todayEvents.length > 0) {
      return {
        displayDate: today,
        displayEvents: todayEvents,
        dayLabel: "Today"
      }
    }
    
    const tomorrowEvents = getAgendaEventsForDay(events, tomorrow)
    return {
      displayDate: tomorrow,
      displayEvents: tomorrowEvents,
      dayLabel: "Tomorrow"
    }
  })();

  // Sort events by start time
  const sortedEvents = [...displayEvents].sort((a, b) => a.start.getTime() - b.start.getTime())

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return "All day"
    const startTime = format(event.start, "h:mm a")
    const endTime = format(event.end, "h:mm a")
    return `${startTime} - ${endTime}`
  }

  const getEventBorderColor = (color?: string) => {
    switch (color) {
      case "sky": return "border-l-sky-500"
      case "amber": return "border-l-amber-500"
      case "violet": return "border-l-violet-500"
      case "rose": return "border-l-rose-500"
      case "emerald": return "border-l-emerald-500"
      case "orange": return "border-l-orange-500"
      default: return "border-l-blue-500"
    }
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {dayLabel}'s Schedule
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(displayDate, "EEEE, MMMM d")} • {sortedEvents.length} {sortedEvents.length === 1 ? 'class' : 'classes'}
        </p>
      </div>

      <div className="space-y-2">
        {sortedEvents.length > 0 ? (
          <>
            {sortedEvents.map((event) => (
              <div 
                key={event.id} 
                className={`relative p-3 rounded-lg border-l-4 ${getEventBorderColor(event.color)} bg-card hover:bg-accent/50 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {event.description?.split('\n')[0] || event.title}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-right">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatEventTime(event)}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Link href="/scheduler">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Calendar
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No classes scheduled for {dayLabel.toLowerCase()}
            </p>
            <Link href="/scheduler">
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Full Calendar
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}