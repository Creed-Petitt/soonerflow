'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { fetchWithAuth } from '@/lib/api-client'

interface Semester {
  code: string
  name: string
  class_count: number
  is_summer: boolean
}

export function useSemesterManagement() {
  const { data: session, status } = useSession()
  const [currentSemester, setCurrentSemesterState] = useState<string>('202510')
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([])
  const [includeSummerSemesters, setIncludeSummerSemesters] = useState<boolean>(false)
  const [includeHistoricalSemesters, setIncludeHistoricalSemesters] = useState<boolean>(false)

  // Load semesters and migration on mount
  useEffect(() => {
    loadSemesters();

    // One-time migration of completed courses to schedules
    if (session?.user?.githubId && status === "authenticated") {
      fetch(`/api/users/${session.user.githubId}/migrate-completed-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(response => {
        if (response.ok) {
          response.json().then(result => {
            // Migration completed
          });
        }
      }).catch(error => {
        console.error('Migration failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.githubId, status]);

  const getCurrentSemester = () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    if (month >= 1 && month <= 5) {
      return `${year - 1}20`
    } else if (month >= 8 && month <= 12) {
      return `${year}10`
    } else {
      return `${year - 1}30`
    }
  }

  const loadSemesters = async () => {
    try {
      const url = `/api/semesters?include_summers=${includeSummerSemesters}&include_historical=${includeHistoricalSemesters}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAvailableSemesters(data)
      }
    } catch (err) {
      console.error('Failed to load semesters:', err)
    }
  }

  const setCurrentSemester = async (semester: string) => {
    const actualCurrentSemester = getCurrentSemester()

    if (semester < actualCurrentSemester) {
      console.warn(`⚠️ Cannot switch to past semester ${semester}. Minimum allowed is ${actualCurrentSemester}`)
    }

    try {
      setCurrentSemesterState(semester)

      // Only call API if we have a session
      if (session?.user?.githubId || session?.user?.googleId) {
        const providerId = session.user.githubId || session.user.googleId
        const activateResponse = await fetchWithAuth(`/api/users/${providerId}/activate-semester/${semester}`, {
          method: 'POST'
        })

        if (!activateResponse.ok) {
          throw new Error('Failed to activate semester schedule')
        }
      }
    } catch (err) {
      console.error('Failed to switch semester:', err)
    }
  }

  return {
    currentSemester,
    availableSemesters,
    includeSummerSemesters,
    includeHistoricalSemesters,
    setCurrentSemester,
    setIncludeSummerSemesters,
    setIncludeHistoricalSemesters,
    loadSemesters,
    getCurrentSemester,
  }
}