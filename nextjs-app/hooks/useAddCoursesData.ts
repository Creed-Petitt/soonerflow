"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { semesterNameToCode } from "@/utils/semester-utils";
import { useClassData } from "@/hooks/useClassData";
import { useDepartments } from "@/hooks/useDepartments";
import type { Course, ClassData, GroupedClass, Department } from "@/types/course";

interface UseAddCoursesDataProps {
  semester: string;
  isOpen: boolean;
}

export function useAddCoursesData({ semester, isOpen }: UseAddCoursesDataProps) {
  const { data: session } = useSession();
  const currentSemester = semesterNameToCode(semester);

  // Filtering state
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [userMajor, setUserMajor] = useState<string | null>(null);

  // Course data state
  const [majorCourses, setMajorCourses] = useState<Course[]>([]);
  const [majorLoading, setMajorLoading] = useState(false);

  // Use existing hooks for department and class data
  const { departments, loading: departmentsLoading } = useDepartments();
  const {
    groupedClasses,
    loading: classDataLoading,
    totalClassCount,
    currentPage,
    loadClassesForDepartment,
    loadMoreClasses,
    clearClasses
  } = useClassData();

  // Load user's major when modal opens
  const loadUserMajor = useCallback(async () => {
    if (session?.user?.email && !userMajor) {
      try {
        const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`);
        if (response.ok) {
          const data = await response.json();
          setUserMajor(data.majorName);
        }
      } catch (error) {
        console.error('Failed to fetch user major:', error);
      }
    }
  }, [session?.user?.email, userMajor]);

  // Load major-specific courses
  const loadMajorCourses = useCallback(async () => {
    if (!userMajor) {
      setMajorCourses([]);
      return;
    }

    try {
      setMajorLoading(true);
      const response = await fetch(`/api/major-courses?major_name=${encodeURIComponent(userMajor)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const uniqueCourses = new Map();
        data.forEach((course: any) => {
          const courseKey = `${course.subject}-${course.courseNumber}`;
          if (!uniqueCourses.has(courseKey)) {
            uniqueCourses.set(courseKey, {
              id: courseKey,
              code: `${course.subject} ${course.courseNumber}`,
              name: course.title,
              credits: course.credits || 3,
              category: course.category || course.subject
            });
          }
        });

        const courses = Array.from(uniqueCourses.values());
        setMajorCourses(courses);
      } else {
        setMajorCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch major courses:', error);
      setMajorCourses([]);
    } finally {
      setMajorLoading(false);
    }
  }, [userMajor]);


  // Convert grouped classes to Course format for department view
  const getDepartmentCourses = useCallback((): Course[] => {
    return groupedClasses.map(group => ({
      id: `${group.subject}-${group.number}`,
      code: `${group.subject} ${group.number}`,
      name: group.title,
      credits: group.credits || 3,
      category: group.subject
    }));
  }, [groupedClasses]);

  // Get displayed courses based on current view
  const getDisplayedCourses = useCallback((): Course[] => {
    if (selectedDepartment === "major") {
      return majorCourses;
    }
    return getDepartmentCourses();
  }, [selectedDepartment, majorCourses, getDepartmentCourses]);

  // Reset function
  const resetData = useCallback(() => {
    setSelectedDepartment("");
    setMajorCourses([]);
    clearClasses();
  }, [clearClasses]);

  // Wrapper functions with proper semester handling
  const loadClassesForDepartmentWrapper = useCallback((dept: string) => {
    return loadClassesForDepartment(dept, currentSemester);
  }, [loadClassesForDepartment, currentSemester]);

  const loadMoreClassesWrapper = useCallback(() => {
    return loadMoreClasses(currentSemester);
  }, [loadMoreClasses, currentSemester]);

  return {
    // Department/filter state
    selectedDepartment,
    setSelectedDepartment,
    departments,
    departmentsLoading,

    // Major courses
    userMajor,
    majorCourses,
    majorLoading,

    // Department courses (from useClassData)
    departmentCourses: getDepartmentCourses(),
    classDataLoading,
    totalClassCount,
    currentPage,

    // Display data
    displayedCourses: getDisplayedCourses(),

    // Actions
    loadUserMajor,
    loadMajorCourses,
    loadClassesForDepartment: loadClassesForDepartmentWrapper,
    loadMoreClasses: loadMoreClassesWrapper,
    resetData
  };
}