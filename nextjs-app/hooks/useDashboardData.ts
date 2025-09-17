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
    loading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    updateGpaAndCredits
  } = useDashboardProfile();

  const {
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    loadingCourses,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  } = useCourseManagement(enrollmentYear, graduationYear, updateGpaAndCredits);

  return {
    creditsCompleted,
    totalCredits,
    gpa,
    majorName,
    enrollmentYear,
    graduationYear,
    loading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    loadingCourses,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  };
}