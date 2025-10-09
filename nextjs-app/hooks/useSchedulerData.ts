'use client'

import { useState, useMemo } from 'react'
import { useSchedule } from '@/hooks/use-schedule'
import { processCalendarEvents, groupClassesBySubject, getSemesterDates } from '@/lib/calendar-utils'
import type { CalendarEvent } from '@/components/event-calendar/types'
import type { ClassData, ScheduledClass, GroupedClass } from '@/types/course'
import { classColors } from '@/constants/colors'
import { demoClasses } from '@/lib/demo-classes'

export function useSchedulerData() {
  const {
    scheduledClasses: rawScheduledClasses,
    currentSemester,
    isLoading
  } = useSchedule()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])
  const [hideDemoClasses, setHideDemoClasses] = useState(false)

  const scheduledClasses = useMemo(() => {
    // Show demo classes when schedule is empty and not hidden
    const classesToUse = (rawScheduledClasses.length === 0 && !hideDemoClasses) ? demoClasses : rawScheduledClasses
    return classesToUse.map((cls, index) => ({
      ...cls,
      colorBg: classColors[index % classColors.length].bg,
      colorHex: classColors[index % classColors.length].hex,
    }))
  }, [rawScheduledClasses, hideDemoClasses])

  const clearDemoClasses = () => {
    setHideDemoClasses(true)
  }

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
    clearDemoClasses,
  }
}