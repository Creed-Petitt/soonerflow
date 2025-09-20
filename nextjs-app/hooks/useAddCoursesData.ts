"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { semesterNameToCode } from "@/utils/semester-utils";
import { fetchDepartments, fetchMajorCourses } from "@/lib/department-api";
import { fetchClassesForDepartment, processClasses } from "@/lib/class-api";
import type { Course, Department } from "@/types/course";

interface UseAddCoursesDataProps {
  semester: string;
  isOpen: boolean;
}

export function useAddCoursesData({ semester, isOpen }: UseAddCoursesDataProps) {
  const { data: session } = useSession();
  const currentSemester = semesterNameToCode(semester);

  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [userMajor, setUserMajor] = useState<string | null>(null);
  const [majorCourses, setMajorCourses] = useState<Course[]>([]);
  const [departmentClasses, setDepartmentClasses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserMajor = useCallback(async () => {
    if (!session?.user?.email || userMajor) return;

    try {
      const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setUserMajor(data.majorName);
      }
    } catch (error) {
      console.error('Failed to fetch user major:', error);
    }
  }, [session?.user?.email, userMajor]);

  const loadMajorCourses = async () => {
    if (!userMajor) {
      setMajorCourses([]);
      return;
    }

    setIsLoading(true);
    const courses = await fetchMajorCourses(userMajor);
    setMajorCourses(courses);
    setIsLoading(false);
  };

  const loadClassesForDepartment = async (dept: string) => {
    setIsLoading(true);
    const { classes } = await fetchClassesForDepartment(dept, currentSemester);
    const processed = processClasses(classes);

    const courses = processed.map(group => ({
      id: `${group.subject}-${group.number}`,
      code: `${group.subject} ${group.number}`,
      name: group.title,
      credits: group.credits || 3,
      category: group.subject
    }));

    setDepartmentClasses(courses);
    setIsLoading(false);
  };

  const loadDepartments = async () => {
    const deptList = await fetchDepartments(currentSemester);
    setDepartments(deptList);
  };

  const displayedCourses = selectedDepartment === "major" ? majorCourses : departmentClasses;

  return {
    isLoading,
    selectedDepartment,
    setSelectedDepartment,
    departments,
    userMajor,
    majorCourses,
    departmentCourses: departmentClasses,
    totalClassCount: displayedCourses.length,
    currentPage: 1,
    displayedCourses,
    loadUserMajor,
    loadMajorCourses,
    loadClassesForDepartment,
    loadDepartments,
    resetData: () => {
      setSelectedDepartment("");
      setMajorCourses([]);
      setDepartmentClasses([]);
    }
  };
}