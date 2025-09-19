"use client";

import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { useCourseManagement } from "@/hooks/useCourseManagement";

export function useDashboardData() {
  const {
    creditsCompleted,
    totalCredits,
    gpa,
    majorName,
    enrollmentYear,
    graduationYear,
    isLoading: profileLoading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    updateGpaAndCredits
  } = useDashboardProfile();

  const {
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    isLoading: coursesLoading,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  } = useCourseManagement(enrollmentYear, graduationYear, updateGpaAndCredits);

  // Consolidate loading states
  const isLoading = profileLoading || coursesLoading;

  return {
    creditsCompleted,
    totalCredits,
    gpa,
    majorName,
    enrollmentYear,
    graduationYear,
    isLoading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  };
}