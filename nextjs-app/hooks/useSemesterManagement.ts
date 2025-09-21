'use client'

import { useState, useCallback, useEffect } from 'react'

interface Semester {
  code: string
  name: string
  class_count: number
  is_summer: boolean
}

export function useSemesterManagement() {
  const [currentSemester, setCurrentSemesterState] = useState<string>('202510')
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([])
  const [includeSummerSemesters, setIncludeSummerSemesters] = useState<boolean>(false)
  const [includeHistoricalSemesters, setIncludeHistoricalSemesters] = useState<boolean>(false)

  // Load semesters on mount
  useEffect(() => {
    loadSemesters();
  }, []);

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
      const url = `http://127.0.0.1:8000/api/semesters?include_summers=${includeSummerSemesters}&include_historical=${includeHistoricalSemesters}`
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
      // For now, just set the state locally
      // TODO: Add user management and API call to activate semester
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