'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import type { ScheduledClass, Schedule } from '@/types/course'

export function useScheduleData() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false)

  const loadSchedule = useCallback(async (semester?: string, currentSemester?: string) => {
    // Just start with empty schedule - user creates their own by adding classes
    setIsLoading(false)
    setError(null)
    setSchedule({
      schedule_id: 1,
      schedule_name: 'My Schedule',
      semester: semester || '202510',
      classes: []
    })
    setLocalClasses([])
    setHasLoadedSchedule(true)
  }, [])

  const saveSchedule = useCallback(async () => {
    // For now, just update local state - no need to save to backend
    // User can add/remove classes and they'll persist in memory
    if (schedule) {
      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
    }
  }, [schedule, localClasses])

  // Auto-load schedule on mount
  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  return {
    schedule,
    localClasses,
    setLocalClasses,
    isLoading,
    error,
    hasLoadedSchedule,
    loadSchedule,
    saveSchedule,
  }
}