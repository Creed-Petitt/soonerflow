import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDebounce } from './use-debounce'

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
  classes: ScheduledClass[]
}

export function useSchedule() {
  const { data: session, status } = useSession()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // Debounce the class list to avoid too many API calls
  const debouncedClasses = useDebounce(localClasses, 1000)

  // Load user's active schedule on mount
  useEffect(() => {
    if (status === "loading") return
    
    if (status === "authenticated" && session?.user?.githubId) {
      loadSchedule()
    } else {
      // Not logged in - use local state only
      setLoading(false)
    }
  }, [status, session])

  // Save schedule when debounced classes change
  useEffect(() => {
    if (schedule && debouncedClasses !== schedule.classes) {
      saveSchedule()
    }
  }, [debouncedClasses])

  const loadSchedule = async () => {
    if (!session?.user?.githubId) return
    
    try {
      setLoading(true)
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${session.user.githubId}/active-schedule`
      )
      
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
        setLocalClasses(data.classes || [])
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    if (!schedule || !session?.user?.githubId || isSaving) return
    
    try {
      setIsSaving(true)
      
      // Extract class IDs and colors
      const class_ids = localClasses.map(c => c.id)
      const colors: Record<string, string> = {}
      localClasses.forEach(c => {
        colors[c.id] = c.color
      })
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/schedules/${schedule.schedule_id}/classes`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ class_ids, colors }),
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule')
    } finally {
      setIsSaving(false)
    }
  }

  const addClass = useCallback((classData: ScheduledClass) => {
    setLocalClasses(prev => {
      // Check if class already exists
      if (prev.find(c => c.id === classData.id)) {
        return prev
      }
      return [...prev, classData]
    })
  }, [])

  const removeClass = useCallback((classId: string) => {
    setLocalClasses(prev => prev.filter(c => c.id !== classId))
  }, [])

  const updateClass = useCallback((classId: string, updates: Partial<ScheduledClass>) => {
    setLocalClasses(prev => 
      prev.map(c => c.id === classId ? { ...c, ...updates } : c)
    )
  }, [])

  const clearSchedule = useCallback(() => {
    setLocalClasses([])
  }, [])

  const isAuthenticated = status === "authenticated"
  const isClassScheduled = useCallback((classId: string) => {
    return localClasses.some(c => c.id === classId)
  }, [localClasses])

  return {
    scheduledClasses: localClasses,
    schedule,
    loading,
    error,
    isSaving,
    isAuthenticated,
    addClass,
    removeClass,
    updateClass,
    clearSchedule,
    isClassScheduled,
    refreshSchedule: loadSchedule,
  }
}