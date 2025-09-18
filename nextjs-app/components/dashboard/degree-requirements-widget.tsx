"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { useSchedule } from "@/hooks/use-schedule"
import { fetchWithAuth } from "@/lib/api-client"

interface MajorCourse {
  subject: string
  courseNumber: string
  title: string
  credits: number
}

const ITEMS_PER_PAGE = 7

export function DegreeRequirementsWidget() {
  const { data: session } = useSession()
  const { scheduledClasses } = useSchedule()
  const [requirements, setRequirements] = useState<MajorCourse[]>([])
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Load major requirements
  useEffect(() => {
    const loadRequirements = async () => {
      if (!session?.user?.githubId) return

      try {
        // Get user's major (with authentication)
        const userResponse = await fetchWithAuth(`/api/users/${session.user.githubId}`)
        if (!userResponse.ok) {
          return
        }
        
        const userData = await userResponse.json()
        if (!userData.major) {
          return
        }

        // Get major courses using the major-courses endpoint (this endpoint doesn't need auth)
        const reqResponse = await fetch(`/api/major-courses?major_name=${encodeURIComponent(userData.major)}`)
        if (reqResponse.ok) {
          const allCourses = await reqResponse.json()
          
          // Show ALL required courses for the major (no hardcoded filtering)
          // Deduplicate by course code, keeping the first version
          const uniqueCourses = []
          const seen = new Set()
          
          for (const course of allCourses) {
            const key = `${course.subject}-${course.courseNumber}`
            if (!seen.has(key)) {
              seen.add(key)
              uniqueCourses.push(course)
            }
          }
          
          setRequirements(uniqueCourses)
        }
      } catch (error) {
        console.error("Error loading requirements:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRequirements()
  }, [session?.user?.githubId])

  // Load completed courses
  useEffect(() => {
    const loadCompletedCourses = async () => {
      if (!session?.user?.githubId) return

      try {
        const response = await fetchWithAuth(`/api/users/${session.user.githubId}/completed-courses`)
        if (response.ok) {
          const data = await response.json()
          const completed = new Set<string>()
          data.courses?.forEach((course: any) => {
            completed.add(`${course.subject} ${course.courseNumber}`)
          })
          setCompletedCourses(completed)
        }
      } catch (error) {
        console.error("Error loading completed courses:", error)
      }
    }

    loadCompletedCourses()
  }, [session?.user?.githubId])

  // Determine course status
  const getCourseStatus = (subject: string, courseNumber: string) => {
    const courseCode = `${subject} ${courseNumber}`
    
    // Check if completed
    if (completedCourses.has(courseCode)) {
      return "completed"
    }
    
    // Check if currently scheduled
    const isScheduled = scheduledClasses.some(
      cls => cls.subject === subject && cls.number === courseNumber
    )
    if (isScheduled) {
      return "in_progress"
    }
    
    return "not_started"
  }

  // Sort and paginate courses
  const getSortedAndPaginatedCourses = () => {
    // Sort courses: not_started first, then in_progress, then completed
    const sorted = [...requirements].sort((a, b) => {
      const statusA = getCourseStatus(a.subject, a.courseNumber)
      const statusB = getCourseStatus(b.subject, b.courseNumber)

      const statusOrder = { not_started: 0, in_progress: 1, completed: 2 }
      const orderDiff = statusOrder[statusA] - statusOrder[statusB]

      if (orderDiff !== 0) return orderDiff

      // Then sort by course code
      return `${a.subject} ${a.courseNumber}`.localeCompare(`${b.subject} ${b.courseNumber}`)
    })

    // Paginate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    return sorted.slice(startIndex, endIndex)
  }

  const sortedAndPaginatedCourses = getSortedAndPaginatedCourses()

  const totalPages = Math.ceil(requirements.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Degree Requirements</h2>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (requirements.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Degree Requirements</h2>
        <div className="text-sm text-muted-foreground">
          No requirements found. Please update your major in settings.
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case "in_progress":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>
      default:
        return <Badge variant="secondary" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Not Started</Badge>
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Degree Requirements</h2>
      <div className="flex flex-col max-h-[350px]">
        <div className="flex-1 overflow-y-auto min-h-[280px]">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between px-1">
              <span className="font-medium">Course</span>
              <div className="flex gap-12">
                <span className="font-medium ml-2">Credits</span>
                <span className="font-medium">Status</span>
              </div>
            </div>
            {sortedAndPaginatedCourses.map((course) => {
              const status = getCourseStatus(course.subject, course.courseNumber)
              return (
                <div
                  key={`${course.subject}-${course.courseNumber}`}
                  className="flex justify-between items-center py-2 px-1 hover:bg-accent/50 rounded transition-colors"
                >
                  <span className="font-medium text-sm">
                    {course.subject === 'CS' && course.courseNumber === '3000' ? 'ECE/CS 3000-4000 Level' :
                     course.subject === 'CS' && course.courseNumber === '4000' ? 'ECE/CS 4000+ Level' :
                     `${course.subject} ${course.courseNumber}`}
                  </span>
                  <div className="flex items-center gap-12">
                    <span className="text-sm text-center w-8">
                      {course.subject === 'CS' && course.courseNumber === '3000' ? '6' :
                       course.subject === 'CS' && course.courseNumber === '4000' ? '6' :
                       course.credits}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {status === "completed" ? "Completed" : 
                       status === "in_progress" ? "In Progress" : 
                       "Not Started"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage <= 2) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = Math.max(1, totalPages - 2) + i;
            } else {
              pageNum = currentPage - 1 + i;
            }
            
            // Ensure pageNum is within valid range
            if (pageNum < 1 || pageNum > totalPages) return null
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-2 py-1 text-xs rounded ${
                  currentPage === pageNum ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
        )}
      </div>
    </div>
  )
}