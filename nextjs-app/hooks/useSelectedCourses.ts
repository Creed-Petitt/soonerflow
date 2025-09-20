"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { calculateGPA, calculateTotalCredits } from "@/lib/gpa-calculator";
import type { Course, SelectedCourse } from "@/types/course";

interface UseSelectedCoursesProps {
  isOpen: boolean;
  existingCourses?: SelectedCourse[];
  onSave: (courses: SelectedCourse[]) => void;
}

export function useSelectedCourses({ isOpen, existingCourses = [], onSave }: UseSelectedCoursesProps) {
  const { data: session } = useSession();

  const [selectedCourses, setSelectedCourses] = useState<Map<string, SelectedCourse>>(new Map());
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());

  const loadCompletedCourses = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`);
      if (!response.ok) return;

      const dashboardData = await response.json();
      const completed = new Set<string>();

      if (dashboardData.semesters) {
        dashboardData.semesters.forEach((sem: any) => {
          if (sem.courses && sem.courses.length > 0) {
            sem.courses.forEach((course: any) => {
              if (course.code) {
                const parts = course.code.trim().split(/\s+/);
                if (parts.length >= 2) {
                  const subject = parts.slice(0, -1).join(' ');
                  const number = parts[parts.length - 1];
                  const courseId = `${subject}-${number}`;
                  completed.add(courseId);
                }
              }
            });
          }
        });
      }
      setCompletedCourses(completed);
    } catch (error) {
      console.error('Failed to fetch completed courses:', error);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCourses(new Map());
      return;
    }

    loadCompletedCourses();

    if (existingCourses.length > 0) {
      const existingMap = new Map();
      existingCourses.forEach(course => {
        let courseId = course.id;
        if (course.code) {
          const parts = course.code.trim().split(/\s+/);
          if (parts.length >= 2) {
            const subject = parts.slice(0, -1).join(' ');
            const number = parts[parts.length - 1];
            courseId = `${subject}-${number}`;
          }
        }

        existingMap.set(courseId, {
          id: courseId,
          code: course.code,
          name: course.name,
          credits: course.credits || 3,
          category: course.code ? course.code.split(' ')[0] : '',
          grade: course.grade
        });
      });
      setSelectedCourses(existingMap);
    }
  }, [isOpen, existingCourses, loadCompletedCourses]);

  const handleCourseToggle = useCallback((course: Course) => {
    if (completedCourses.has(course.id)) return;

    const newSelected = new Map(selectedCourses);
    if (newSelected.has(course.id)) {
      newSelected.delete(course.id);
    } else {
      newSelected.set(course.id, { ...course, grade: 'A' });
    }
    setSelectedCourses(newSelected);
  }, [selectedCourses, completedCourses]);

  const handleGradeChange = useCallback((courseId: string, grade: string) => {
    const newSelected = new Map(selectedCourses);
    const course = newSelected.get(courseId);
    if (course) {
      newSelected.set(courseId, { ...course, grade });
      setSelectedCourses(newSelected);
    }
  }, [selectedCourses]);

  const handleRemoveCourse = useCallback((courseId: string) => {
    const newSelected = new Map(selectedCourses);
    newSelected.delete(courseId);
    setSelectedCourses(newSelected);
  }, [selectedCourses]);

  const handleSave = useCallback(() => {
    const coursesArray = Array.from(selectedCourses.values());
    onSave(coursesArray);
  }, [selectedCourses, onSave]);

  const selectedCoursesArray = Array.from(selectedCourses.values());

  return {
    selectedCourses: selectedCoursesArray,
    selectedCoursesMap: selectedCourses,
    completedCourses,
    totalCredits: calculateTotalCredits(selectedCoursesArray),
    projectedGPA: calculateGPA(selectedCoursesArray),
    selectedCount: selectedCourses.size,
    handleCourseToggle,
    handleGradeChange,
    handleRemoveCourse,
    handleSave,
    isCourseSelected: (courseId: string) => selectedCourses.has(courseId),
    isCourseCompleted: (courseId: string) => completedCourses.has(courseId),
  };
}