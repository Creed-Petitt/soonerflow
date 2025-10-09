'use client'

import { useState, useCallback, useRef } from 'react'
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

  // Track the last loaded semester to prevent unnecessary reloads
  const lastLoadedSemesterRef = useRef<string | null>(null)

  const loadSchedule = useCallback(async (semester?: string) => {
    if (!currentUser) {
      // Wait for auth to initialize
      setIsLoading(false)
      return
    }

    const targetSemester = semester || '202510'

    // Prevent loading the same semester twice
    if (lastLoadedSemesterRef.current === targetSemester && hasLoadedSchedule) {
      return
    }

    setIsLoading(true)
    setError(null)
    lastLoadedSemesterRef.current = targetSemester

    try {
      // All users (including anonymous) use backend
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
  }, [currentUser, hasLoadedSchedule])

  const saveSchedule = useCallback(async () => {
    if (!schedule || !currentUser) return

    try {
      // All users save to backend the same way
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

  return {
    schedule,
    localClasses,
    setLocalClasses,
    isLoading,
    error,
    hasLoadedSchedule,
    setHasLoadedSchedule,
    loadSchedule,
    saveSchedule,
  }
}