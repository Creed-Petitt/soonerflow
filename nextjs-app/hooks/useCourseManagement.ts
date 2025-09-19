"use client";

import { useCompletedCourses } from "@/hooks/useCompletedCourses";
import { useSemesterTimeline } from "@/hooks/useSemesterTimeline";
import { useCourseActions } from "@/hooks/useCourseActions";
import { parseClassTime } from "@/lib/time-utils";

export function useCourseManagement(enrollmentYear: number | null, graduationYear: number | null, onGpaUpdate: (credits: number, gpa: number) => void) {
  const {
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    setAllSemesterSchedules,
    isLoading,
    currentSemesterName,
    handleRemoveCourse,
    handleCoursesUpdate
  } = useCompletedCourses(onGpaUpdate);

  const { semesterTimelineData } = useSemesterTimeline(
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    enrollmentYear,
    graduationYear
  );

  useCourseActions(setAllSemesterSchedules);

  const parseTimeToEvents = (classData: any) => {
    const timeData = parseClassTime(classData.time)
    if (!timeData) return []

    const { days: classDays, startTime, endTime } = timeData

    const dayMap: { [key: string]: number } = {
      'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5
    }

    const events = []
    const today = new Date()
    const startOfSemester = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfSemester = new Date(today.getFullYear(), today.getMonth() + 4, 30)

    classDays.forEach(dayLetter => {
      const dayOfWeek = dayMap[dayLetter] || 1
      const currentDate = new Date(startOfSemester)

      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1)
      }

      while (currentDate <= endOfSemester) {
        const startDate = new Date(currentDate)
        startDate.setHours(startTime.hour, startTime.min, 0, 0)

        const endDate = new Date(startDate)
        endDate.setHours(endTime.hour, endTime.min, 0, 0)

        events.push({
          id: `${classData.id}-${dayOfWeek}-${startDate.toISOString()}`,
          title: `${classData.subject} ${classData.number}`,
          description: `${classData.title}\nInstructor: ${classData.instructor}\nLocation: ${classData.location}`,
          start: startDate,
          end: endDate,
          color: classData.color === 'bg-blue-500' ? 'sky' :
                 classData.color === 'bg-green-500' ? 'emerald' :
                 classData.color === 'bg-purple-500' ? 'violet' :
                 classData.color === 'bg-orange-500' ? 'orange' :
                 classData.color === 'bg-pink-500' ? 'rose' :
                 'sky',
          location: classData.location
        })

        currentDate.setDate(currentDate.getDate() + 7)
      }
    })

    return events
  }

  const getCurrentSemester = () => currentSemesterName;

  return {
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    isLoading,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  };
}