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
    try {
      setIsLoading(true)
      setError(null)

      // For now, just load without a specific user ID
      // In the future, you can add user management here
      const response = await fetchWithAuth('/api/schedules/1') // Using schedule ID 1 as default
      const data = await response.json()

      // Remove duplicates by ID
      const classMap = new Map<string, ScheduledClass>()
      ;(data.classes || []).forEach((cls: ScheduledClass) => {
        if (!classMap.has(cls.id)) {
          classMap.set(cls.id, cls)
        }
      })
      const uniqueClasses = Array.from(classMap.values())

      setSchedule({ ...data, classes: uniqueClasses })
      setLocalClasses(uniqueClasses)
      setHasLoadedSchedule(true)
    } catch (err) {
      console.error('Failed to load schedule:', err)
      setError('Failed to load schedule')
      // Set empty state for now
      setSchedule(null)
      setLocalClasses([])
      setHasLoadedSchedule(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveSchedule = useCallback(async () => {
    if (!schedule || isLoading) return

    try {
      setIsLoading(true)

      const class_ids = localClasses.map(c => c.id)
      const colors: Record<string, string> = {}
      localClasses.forEach(c => {
        colors[c.id] = c.color
      })

      await fetchWithAuth(`/api/schedules/${schedule.schedule_id}/classes`, {
        method: 'PUT',
        body: JSON.stringify({ class_ids, colors })
      })

      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule')
    } finally {
      setIsLoading(false)
    }
  }, [schedule, isLoading, localClasses])

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