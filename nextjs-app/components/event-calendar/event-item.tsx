"use client"


import { differenceInMinutes, format, getMinutes, isPast } from "date-fns"

import { getBorderRadiusClasses, getEventColorClasses } from "@/components/event-calendar/utils"
import type { CalendarEvent } from "@/components/event-calendar/types"
import { cn } from "@/lib/utils"

// Using date-fns format with custom formatting:
// 'h' - hours (1-12)
// 'a' - am/pm
// ':mm' - minutes with leading zero (only if the token 'mm' is present)
const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase()
}

interface EventWrapperProps {
  event: CalendarEvent
  isFirstDay?: boolean
  isLastDay?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
}

// Shared wrapper component for event styling
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  onClick,
  className,
  children,
}: EventWrapperProps) {
  const isEventInPast = false // Template events are never "past"

  const isHexColor = event.color && event.color.startsWith('#')

  return (
    <button
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex size-full overflow-hidden px-1 text-left font-medium backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] data-past-event:line-through sm:px-2 items-center",
        getEventColorClasses(event.color),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        className
      )}
      style={isHexColor ? {
        backgroundColor: event.color + 'CC',
        opacity: event.id?.startsWith('demo-') ? 0.8 : 1
      } : undefined}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface EventItemProps {
  event: CalendarEvent
  view: "month" | "week" | "day" | "agenda"
  onClick?: (e: React.MouseEvent) => void
  showTime?: boolean
  currentTime?: Date // For updating time during drag
  isFirstDay?: boolean
  isLastDay?: boolean
  children?: React.ReactNode
  className?: string
}

export function EventItem({
  event,
  view,
  onClick,
  showTime,
  currentTime,
  isFirstDay = true,
  isLastDay = true,
  children,
  className,
}: EventItemProps) {
  const eventColor = event.color

  // Use the provided currentTime (for dragging) or the event's actual time
  const displayStart = currentTime || new Date(event.start)

  const displayEnd = currentTime
      ? new Date(
          new Date(currentTime).getTime() +
            (new Date(event.end).getTime() - new Date(event.start).getTime())
        )
      : new Date(event.end)

  // Calculate event duration in minutes
  const durationMinutes = differenceInMinutes(displayEnd, displayStart)

  const getEventTime = () => {
    if (event.allDay) return "All day"

    // For short events (less than 45 minutes), only show start time
    if (durationMinutes < 45) {
      return formatTimeWithOptionalMinutes(displayStart)
    }

    // For longer events, show both start and end time
    return `${formatTimeWithOptionalMinutes(displayStart)} - ${formatTimeWithOptionalMinutes(displayEnd)}`
  }

  if (view === "month") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        className={cn(
          "mt-[var(--event-gap)] h-[var(--event-height)] items-center text-[10px] sm:text-xs",
          className
        )}
      >
        {children || (
          <span className="truncate flex items-center gap-1">
            {!event.allDay && (
              <span className="truncate font-normal opacity-70 sm:text-[11px]">
                {formatTimeWithOptionalMinutes(displayStart)}{" "}
              </span>
            )}
            {event.title}
            {event.isDemo && (
              <span className="text-[7px] px-1 py-0.5 bg-white/20 rounded text-white/70 font-normal flex-shrink-0">
                DEMO
              </span>
            )}
          </span>
        )}
      </EventWrapper>
    )
  }

  if (view === "week" || view === "day") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        className={cn(
          "py-1",
          durationMinutes < 45 ? "items-center" : "flex-col",
          view === "week" ? "text-xs sm:text-sm" : "text-sm",
          className
        )}
      >
        {durationMinutes < 45 ? (
          <div className="truncate">
            {event.title}{" "}
            {event.isDemo && (
              <span className="text-[8px] px-1 py-0.5 bg-white/20 rounded text-white/70 font-normal ml-1">
                DEMO
              </span>
            )}
            {showTime && (
              <span className="opacity-70">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="truncate font-medium flex items-center gap-1">
              {event.title}
              {event.isDemo && (
                <span className="text-[8px] px-1 py-0.5 bg-white/20 rounded text-white/70 font-normal flex-shrink-0">
                  DEMO
                </span>
              )}
            </div>
            {showTime && (
              <div className="truncate font-normal opacity-70 sm:text-[11px]">
                {getEventTime()}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    )
  }

  // Agenda view - kept separate since it's significantly different
  const isAgendaHexColor = eventColor && eventColor.startsWith('#')

  return (
    <button
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded p-2 text-left transition outline-none focus-visible:ring-[3px] data-past-event:line-through data-past-event:opacity-90",
        getEventColorClasses(eventColor),
        className
      )}
      style={isAgendaHexColor ? { backgroundColor: eventColor + 'CC' } : undefined} // Add some transparency
      data-past-event={isPast(new Date(event.end)) || undefined}
      onClick={onClick}
    >
      <div className="text-sm font-medium">{event.title}</div>
      <div className="text-xs opacity-70">
        {event.allDay ? (
          <span>All day</span>
        ) : (
          <span className="uppercase">
            {formatTimeWithOptionalMinutes(displayStart)} -{" "}
            {formatTimeWithOptionalMinutes(displayEnd)}
          </span>
        )}
        {event.location && (
          <>
            <span className="px-1 opacity-35"> · </span>
            <span>{event.location}</span>
          </>
        )}
      </div>
      {event.description && (
        <div className="my-1 text-xs opacity-90">{event.description}</div>
      )}
    </button>
  )
}
