'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { fetchWithAuth } from '@/lib/api-client'

interface ScheduledClass {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  time: string
  location: string
  credits: number
  type?: string
  color: string
  available_seats?: number
  total_seats?: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
}

interface Schedule {
  schedule_id: number
  schedule_name: string
  semester: string
  classes: ScheduledClass[]
}

export function useScheduleData() {
  const { data: session, status } = useSession()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false)

  const loadSchedule = async (semester?: string, currentSemester?: string) => {
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

    const targetSemester = semester || currentSemester

    try {
      setIsLoading(true)
      const response = await fetchWithAuth(`/api/users/${session.user.githubId}/active-schedule`)

      if (!response.ok) {
        throw new Error('Failed to load schedule')
      }

      const data = await response.json()

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
    } finally {
      setIsLoading(false)
    }
  }

  const saveSchedule = async () => {
    if (!schedule || !session?.user?.githubId || isLoading) return

    try {
      setIsLoading(true)

      const class_ids = localClasses.map(c => c.id)
      const colors: Record<string, string> = {}
      localClasses.forEach(c => {
        colors[c.id] = c.color
      })

      const response = await fetch(`/api/schedules/${schedule.schedule_id}/classes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_ids, colors }),
      })

      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }

      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null)
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule')
    } finally {
      setIsLoading(false)
    }
  }

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