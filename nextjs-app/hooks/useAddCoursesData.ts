"use client";

import { useState, useCallback, useDeferredValue } from "react";
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

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [userMajor, setUserMajor] = useState<string | null>(null);

  // Course data state
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [majorCourses, setMajorCourses] = useState<Course[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [majorLoading, setMajorLoading] = useState(false);

  // Use existing hooks for department and class data
  const { departments, loading: departmentsLoading } = useDepartments();
  const {
    groupedClasses,
    loading: classDataLoading,
    isLoadingMore,
    totalClassCount,
    currentPage,
    loadClassesForDepartment,
    performServerSearch,
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

  // Global search functionality
  const performGlobalSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/classes?search=${encodeURIComponent(query)}&semester=${currentSemester}&limit=500&skip_ratings=true`);
      const data = await response.json();

      if (data.classes && data.classes.length > 0) {
        // Group classes like in the original modal
        const grouped: Record<string, GroupedClass> = {};
        data.classes.forEach((cls: any) => {
          if (!cls.subject || (!cls.number && !cls.courseNumber)) return;

          const key = `${cls.subject} ${cls.number || cls.courseNumber}`;

          if (!grouped[key]) {
            grouped[key] = {
              subject: cls.subject,
              number: cls.number || cls.courseNumber,
              title: cls.title,
              credits: cls.credits,
              sections: [],
              labSections: []
            };
          }

          if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
            grouped[key].labSections.push(cls);
          } else {
            grouped[key].sections.push(cls);
          }
        });

        const groupedArray = Object.values(grouped).filter(g =>
          g.sections.length > 0 || g.labSections.length > 0
        );

        const searchCourses: Course[] = groupedArray.map(group => ({
          id: `${group.subject}-${group.number}`,
          code: `${group.subject} ${group.number}`,
          name: group.title,
          credits: group.credits || 3,
          category: group.subject
        }));

        setSearchResults(searchCourses);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [currentSemester]);

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
    if (deferredSearchQuery.length >= 1) {
      return searchResults;
    }
    if (selectedDepartment === "major") {
      return majorCourses;
    }
    return getDepartmentCourses();
  }, [deferredSearchQuery, searchResults, selectedDepartment, majorCourses, getDepartmentCourses]);

  // Reset functions
  const resetSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const resetData = useCallback(() => {
    resetSearch();
    setSelectedDepartment("");
    setMajorCourses([]);
    clearClasses();
  }, [resetSearch, clearClasses]);

  // Wrapper functions with proper semester handling
  const loadClassesForDepartmentWrapper = useCallback((dept: string) => {
    return loadClassesForDepartment(dept, currentSemester);
  }, [loadClassesForDepartment, currentSemester]);

  const loadMoreClassesWrapper = useCallback(() => {
    return loadMoreClasses(currentSemester);
  }, [loadMoreClasses, currentSemester]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    searchResults,
    searchLoading,

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
    isLoadingMore,
    totalClassCount,
    currentPage,

    // Display data
    displayedCourses: getDisplayedCourses(),

    // Actions
    loadUserMajor,
    loadMajorCourses,
    loadClassesForDepartment: loadClassesForDepartmentWrapper,
    loadMoreClasses: loadMoreClassesWrapper,
    performGlobalSearch,
    resetSearch,
    resetData
  };
}