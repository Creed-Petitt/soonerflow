'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { saveScheduleClasses, fetchUserActiveSchedule, fetchScheduleForSemester } from '@/lib/schedule-api'
import { useAuth } from '@/contexts/auth-context'
import type { ScheduledClass, Schedule } from '@/types/course'

export function useScheduleData() {
  const { currentUser } = useAuth()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false)

  // Local storage for anonymous users - separate schedules per semester
  const [anonymousSchedules, setAnonymousSchedules] = useState<Record<string, ScheduledClass[]>>({})

  const loadSchedule = useCallback(async (semester?: string, currentSemester?: string) => {
    setIsLoading(true)
    setError(null)
    const targetSemester = semester || currentSemester || '202510'

    if (!currentUser) {
      // Anonymous user - use local state only
      const semesterClasses = anonymousSchedules[targetSemester] || []
      setSchedule({
        schedule_id: 0, // Use 0 for anonymous
        schedule_name: `My Schedule - ${targetSemester}`,
        semester: targetSemester,
        classes: semesterClasses
      })
      setLocalClasses(semesterClasses)
      setIsLoading(false)
      setHasLoadedSchedule(true)
      return
    }

    try {
      // Logged in user - use backend
      const userSchedule = await fetchScheduleForSemester(targetSemester)
      setSchedule(userSchedule)
      setLocalClasses(userSchedule.classes || [])
    } catch (error) {
      console.log('Could not load user schedule, starting fresh:', error)
      setSchedule({
        schedule_id: 1,
        schedule_name: 'My Schedule',
        semester: targetSemester,
        classes: []
      })
      setLocalClasses([])
    } finally {
      setIsLoading(false)
      setHasLoadedSchedule(true)
    }
  }, [currentUser, anonymousSchedules])

  const saveSchedule = useCallback(async () => {
    if (!schedule) return

    if (!currentUser) {
      // Anonymous user - save to local state only
      setAnonymousSchedules(prev => ({
        ...prev,
        [schedule.semester]: localClasses
      }))
      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
      return
    }

    try {
      // Logged in user - save to backend
      const classIds = localClasses.map(cls => cls.id)
      const colors = localClasses.reduce((acc, cls) => {
        if (cls.color) {
          acc[cls.id] = cls.color
        }
        return acc
      }, {} as Record<string, string>)

      await saveScheduleClasses(schedule.schedule_id, classIds, colors)
      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      setError('Failed to save schedule changes')
    }
  }, [schedule, localClasses, currentUser])

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