'use client'

import { useState, useMemo, Dispatch, SetStateAction } from 'react'
import { useSchedule } from '@/hooks/use-schedule'
import { processCalendarEvents, groupClassesBySubject, getSemesterDates } from '@/lib/calendar-utils'
import type { CalendarEvent } from '@/components/event-calendar/types'

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
  grade?: string
  semester?: string
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

const classColors = [
  { bg: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-green-500', hex: '#10b981' },
  { bg: 'bg-purple-500', hex: '#8b5cf6' },
  { bg: 'bg-orange-500', hex: '#f97316' },
  { bg: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-teal-500', hex: '#14b8a6' },
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-red-500', hex: '#ef4444' },
]

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