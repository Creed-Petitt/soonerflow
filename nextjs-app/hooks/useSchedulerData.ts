"use client"

import { useState, useEffect, useMemo } from "react"
import type { CalendarEvent } from "@/components/event-calendar/types"
import { useSchedule } from "@/hooks/use-schedule"

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
  { bg: 'bg-red-500', hex: '#ef4444' }
]

export function useSchedulerData() {
  const {
    scheduledClasses: persistedClasses,
    currentSemester,
  } = useSchedule()

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([])

  const getCurrentSemesterCode = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (month >= 1 && month <= 5) {
      return `${year - 1}20`;
    } else if (month >= 8 && month <= 12) {
      return `${year}10`;
    } else {
      return `${year - 1}30`;
    }
  };

  const currentSemesterCode = getCurrentSemesterCode();
  const isCurrentSemester = currentSemester === currentSemesterCode;
  const isFutureSemester = currentSemester > currentSemesterCode;
  const isPastSemester = currentSemester < currentSemesterCode;
  const isInteractiveSemester = isCurrentSemester || isFutureSemester

  const getSemesterDates = () => {
    const year = parseInt(currentSemester.substring(0, 4))
    const term = currentSemester.substring(4)

    if (term === '10') {
      return {
        start: new Date(year, 7, 20),
        end: new Date(year, 11, 15)
      }
    } else if (term === '20') {
      return {
        start: new Date(year + 1, 0, 15),
        end: new Date(year + 1, 4, 15)
      }
    } else {
      return {
        start: new Date(year + 1, 5, 1),
        end: new Date(year + 1, 7, 10)
      }
    }
  }

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const semesterDates = getSemesterDates()
    return semesterDates.start
  })

  useEffect(() => {
    const semesterDates = getSemesterDates()
    setSelectedDate(semesterDates.start)
  }, [currentSemester])

  const scheduledClasses = useMemo(() => {
    return persistedClasses.map((cls: any, index: number) => ({
      ...cls,
      number: cls.number || cls.courseNumber,
      colorBg: classColors[index % classColors.length].bg,
      colorHex: cls.color || classColors[index % classColors.length].hex,
    }))
  }, [persistedClasses])

  const totalCredits = scheduledClasses.reduce((sum, cls) => sum + (cls.credits || 3), 0)

  const subjects = useMemo(() => {
    return [...new Set(scheduledClasses.map(cls => cls.subject))]
  }, [scheduledClasses])

  const parseTimeToEvents = (classData: ScheduledClass) => {
    if (!classData.time || classData.time === 'TBA' || classData.time.trim() === '') {
      const isCompleted = classData.instructor === 'Completed' || classData.type === 'Completed Course'
      const templateDate = new Date(2025, 0, 6)
      templateDate.setHours(9, 0, 0, 0)

      const endDate = new Date(templateDate)
      endDate.setHours(10, 30, 0, 0)

      return [{
        id: `${classData.id}-template`,
        title: isCompleted ? `✓ ${classData.subject} ${classData.number}` : `${classData.subject} ${classData.number}`,
        description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location || 'TBA'}`,
        start: templateDate,
        end: endDate,
        color: (isCompleted ? 'emerald' : 'gray') as any,
        location: classData.location || 'TBA',
        allDay: false
      }]
    }

    const parts = classData.time.split(' ')
    if (parts.length < 3) return []

    const days = parts[0]
    const timeRange = parts.slice(1).join(' ')
    const [startTimeStr, endTimeStr] = timeRange.split('-')

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

    const templateDates: { [key: string]: Date } = {
      'M': new Date(2025, 0, 6),
      'T': new Date(2025, 0, 7),
      'W': new Date(2025, 0, 8),
      'R': new Date(2025, 0, 9),
      'F': new Date(2025, 0, 10),
    }

    const classDays = []
    let i = 0
    while (i < days.length) {
      if (i < days.length - 1 && days.slice(i, i + 2) === 'Th') {
        classDays.push('R')
        i += 2
      } else if (days[i] === 'R') {
        classDays.push('R')
        i++
      } else if (templateDates[days[i]]) {
        classDays.push(days[i])
        i++
      } else {
        i++
      }
    }

    const events = classDays.map(dayLetter => {
      const templateDate = new Date(templateDates[dayLetter])
      templateDate.setHours(startTime.hour, startTime.min, 0, 0)

      const endDate = new Date(templateDate)
      endDate.setHours(endTime.hour, endTime.min, 0, 0)

      return {
        id: `${classData.id}-${dayLetter}`,
        title: `${classData.subject} ${classData.number}`,
        description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location}`,
        start: templateDate,
        end: endDate,
        color: (classData.colorBg === 'bg-blue-500' ? 'sky' :
               classData.colorBg === 'bg-green-500' ? 'emerald' :
               classData.colorBg === 'bg-purple-500' ? 'violet' :
               classData.colorBg === 'bg-orange-500' ? 'orange' :
               classData.colorBg === 'bg-pink-500' ? 'rose' :
               classData.colorBg === 'bg-teal-500' ? 'teal' :
               classData.colorBg === 'bg-indigo-500' ? 'indigo' :
               classData.colorBg === 'bg-red-500' ? 'red' : 'gray') as any,
        location: classData.location
      }
    })

    return events
  }

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
        group.labSections!.push(cls)
      } else {
        group.sections.push(cls)
      }
    })

    return Array.from(groups.values()).filter(group => group.sections.length > 0)
  }

  useEffect(() => {
    const allEvents: CalendarEvent[] = []

    if (scheduledClasses && scheduledClasses.length > 0) {
      scheduledClasses.forEach((cls, index) => {
        const events = parseTimeToEvents(cls)
        allEvents.push(...events)
      })
    }

    setCalendarEvents(allEvents)
  }, [scheduledClasses])

  useEffect(() => {
    if (subjects.length === 0) return

    let cancelled = false

    const loadGroupedClasses = async () => {
      try {
        const allClasses: ClassData[] = []
        for (const subject of subjects) {
          if (cancelled) return

          const response = await fetch(`/api/classes?subject=${subject}&semester=${currentSemester}&limit=100&skip_ratings=true`)
          if (response.ok && !cancelled) {
            const data = await response.json()
            allClasses.push(...(data.classes || []))
          }
        }

        if (!cancelled) {
          const grouped = groupClasses(allClasses)
          setGroupedClasses(grouped)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading grouped classes:', error)
        }
      }
    }

    loadGroupedClasses()

    return () => {
      cancelled = true
    }
  }, [subjects])

  const semesterDates = getSemesterDates()

  return {
    calendarEvents,
    scheduledClasses,
    totalCredits,
    selectedDate,
    setSelectedDate,
    groupedClasses,
    isCurrentSemester,
    isFutureSemester,
    isPastSemester,
    isInteractiveSemester,
    currentSemesterCode,
    semesterDates,
    parseTimeToEvents,
    groupClasses
  }
}