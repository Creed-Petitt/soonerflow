'use client'

import { useState, useMemo, Dispatch, SetStateAction } from 'react'
import { useSchedule } from '@/hooks/use-schedule'
import { processCalendarEvents, groupClassesBySubject, getSemesterDates } from '@/lib/calendar-utils'
import type { CalendarEvent } from '@/components/event-calendar/types'
import type { ClassData, ScheduledClass, GroupedClass } from '@/types/course'
import { classColors } from '@/constants/colors'

export function useSchedulerData() {
  const {
    scheduledClasses: rawScheduledClasses,
    currentSemester,
    isLoading
  } = useSchedule()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])

  const scheduledClasses = useMemo(() => {
    return rawScheduledClasses.map((cls, index) => ({
      ...cls,
      colorBg: classColors[index % classColors.length].bg,
      colorHex: classColors[index % classColors.length].hex,
    }))
  }, [rawScheduledClasses])

  const calendarEvents = useMemo(() => {
    return processCalendarEvents(scheduledClasses)
  }, [scheduledClasses])

  const totalCredits = useMemo(() => {
    return scheduledClasses.reduce((sum, cls) => sum + (cls.credits || 0), 0)
  }, [scheduledClasses])

  const subjects = useMemo(() => {
    return groupClassesBySubject(scheduledClasses)
  }, [scheduledClasses])

  const semesterDates = getSemesterDates()
  const isCurrentSemester = currentSemester >= '202410'
  const isInteractiveSemester = isCurrentSemester

  return {
    isLoading,
    calendarEvents,
    scheduledClasses,
    totalCredits,
    selectedDate,
    setSelectedDate,
    groupedClasses,
    isCurrentSemester,
    isInteractiveSemester,
    semesterDates,
  }
}