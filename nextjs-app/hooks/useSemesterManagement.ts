'use client'

import { useState, useCallback, useEffect } from 'react'
import { getCurrentSemesterCode } from '@/utils/semester-utils'

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

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/semesters?include_summers=${includeSummerSemesters}&include_historical=${includeHistoricalSemesters}`
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
    try {
      setCurrentSemesterState(semester)
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
    getCurrentSemester: getCurrentSemesterCode,
  }
}