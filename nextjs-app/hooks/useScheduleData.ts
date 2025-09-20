'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { fetchUserActiveSchedule, saveScheduleClasses } from '@/lib/schedule-api'
import type { ScheduledClass, Schedule } from '@/types/course'

export function useScheduleData() {
  const { data: session, status } = useSession()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false)

  const loadSchedule = useCallback(async (semester?: string, currentSemester?: string) => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      setSchedule(null)
      setLocalClasses([])
      setIsLoading(false)
      setError(null)
      return
    }

    if (!session?.user?.githubId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await fetchUserActiveSchedule(session.user.githubId)
      setSchedule(data)
      setLocalClasses(data.classes)
      setHasLoadedSchedule(true)
    } catch (err) {
      console.error('Failed to load schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.githubId, status])

  const saveSchedule = useCallback(async () => {
    if (!schedule || !session?.user?.githubId || isLoading) return

    try {
      setIsLoading(true)

      const class_ids = localClasses.map(c => c.id)
      const colors: Record<string, string> = {}
      localClasses.forEach(c => {
        colors[c.id] = c.color
      })

      await saveScheduleClasses(schedule.schedule_id, class_ids, colors)

      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule')
    } finally {
      setIsLoading(false)
    }
  }, [schedule, session?.user?.githubId, isLoading, localClasses])

  // Auto-load schedule when session is ready
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