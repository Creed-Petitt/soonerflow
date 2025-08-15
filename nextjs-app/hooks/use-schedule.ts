import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDebounce } from './use-debounce'

// Global cache to prevent multiple instances from loading simultaneously
let globalLoadPromise: Promise<any> | null = null
let globalScheduleCache: Schedule | null = null
let globalCacheUser: string | null = null

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
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false)
  
  // Debounce the class list to avoid too many API calls
  const debouncedClasses = useDebounce(localClasses, 1000)

  // Load user's active schedule once (FIXED - proper caching)
  useEffect(() => {
    if (status === "loading") return
    
    if (status === "authenticated" && session?.user?.githubId && !hasLoadedSchedule && !isLoadingSchedule) {
      setHasLoadedSchedule(true)
      loadSchedule()
    } else if (status === "unauthenticated") {
      // Not logged in - use local state only
      setLoading(false)
    }
  }, [status, session?.user?.githubId]) // Remove hasLoadedSchedule from deps to prevent loops

  const loadSchedule = async () => {
    if (!session?.user?.githubId) return
    
    // Check if we already have cached data for this user
    if (globalCacheUser === session.user.githubId && globalScheduleCache) {
      console.log('✅ useSchedule: Using cached schedule for', session.user.githubId)
      setSchedule(globalScheduleCache)
      setLocalClasses(globalScheduleCache.classes || [])
      setLoading(false)
      return
    }
    
    // Check if another instance is already loading
    if (globalLoadPromise && globalCacheUser === session.user.githubId) {
      console.log('⏳ useSchedule: Waiting for existing load...')
      try {
        const data = await globalLoadPromise
        setSchedule(data)
        setLocalClasses(data.classes || [])
      } catch (err) {
        console.error('Failed to load schedule:', err)
        setError('Failed to load schedule')
      }
      setLoading(false)
      return
    }
    
    console.log('🔄 useSchedule: Loading schedule for', session.user.githubId)
    
    // Create a new load promise
    globalCacheUser = session.user.githubId
    globalLoadPromise = fetch(`/api/users/${session.user.githubId}/active-schedule`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load schedule')
        return response.json()
      })
      .then(data => {
        globalScheduleCache = data
        return data
      })
    
    try {
      setIsLoadingSchedule(true)
      setLoading(true)
      const data = await globalLoadPromise
      setSchedule(data)
      setLocalClasses(data.classes || [])
    } catch (err) {
      console.error('Failed to load schedule:', err)
      setError('Failed to load schedule')
      globalScheduleCache = null // Clear cache on error
    } finally {
      setLoading(false)
      setIsLoadingSchedule(false)
      globalLoadPromise = null // Clear promise when done
    }
  }

  const saveSchedule = useCallback(async () => {
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
        `/api/schedules/${schedule.schedule_id}/classes`,
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
      
      // Update global cache with new classes
      if (globalScheduleCache && globalCacheUser === session.user.githubId) {
        globalScheduleCache = { ...globalScheduleCache, classes: localClasses }
      }
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule')
    } finally {
      setIsSaving(false)
    }
  }, [schedule, session?.user?.githubId, isSaving, localClasses])

  // Save schedule when debounced classes change (FIXED - prevent infinite loops)
  useEffect(() => {
    if (!hasLoadedSchedule || !schedule || isSaving) return
    
    // Skip auto-save if we just loaded
    if (debouncedClasses.length === 0 && (!schedule.classes || schedule.classes.length === 0)) {
      return // Both empty, no need to save
    }
    
    // Compare class IDs to see if there's an actual change
    const currentClassIds = debouncedClasses.map(c => c.id).sort().join(',')
    const savedClassIds = (schedule.classes || []).map(c => c.id).sort().join(',')
    
    if (currentClassIds !== savedClassIds) {
      console.log('💾 Auto-saving schedule changes...')
      saveSchedule()
    }
  }, [debouncedClasses, hasLoadedSchedule, schedule, isSaving, saveSchedule]) // Include all deps but with proper guards

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