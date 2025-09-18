"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
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

  // Load completed courses when modal opens
  const loadCompletedCourses = useCallback(async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`);
        if (response.ok) {
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
        }
      } catch (error) {
        console.error('Failed to fetch completed courses:', error);
      }
    }
  }, [session?.user?.email]);

  // Initialize selected courses when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCompletedCourses();

      // Reset selection first
      setSelectedCourses(new Map());

      // Then initialize with existing courses if editing
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
            } else {
              courseId = course.code.replace(/\s+/g, '-');
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
    } else {
      // Reset when modal closes
      setSelectedCourses(new Map());
    }
  }, [isOpen, existingCourses, loadCompletedCourses]);

  // Toggle course selection
  const handleCourseToggle = useCallback((course: Course) => {
    // Don't allow selecting courses that are already completed
    if (completedCourses.has(course.id)) {
      return;
    }

    const newSelected = new Map(selectedCourses);
    if (newSelected.has(course.id)) {
      newSelected.delete(course.id);
    } else {
      newSelected.set(course.id, { ...course, grade: 'A' });
    }
    setSelectedCourses(newSelected);
  }, [selectedCourses, completedCourses]);

  // Change grade for a selected course
  const handleGradeChange = useCallback((courseId: string, grade: string) => {
    const newSelected = new Map(selectedCourses);
    const course = newSelected.get(courseId);
    if (course) {
      course.grade = grade;
      newSelected.set(courseId, course);
      setSelectedCourses(newSelected);
    }
  }, [selectedCourses]);

  // Remove a selected course
  const handleRemoveCourse = useCallback((courseId: string) => {
    const newSelected = new Map(selectedCourses);
    newSelected.delete(courseId);
    setSelectedCourses(newSelected);
  }, [selectedCourses]);

  // Calculate total credits
  const totalCredits = Array.from(selectedCourses.values()).reduce((sum, course) => sum + course.credits, 0);

  // Calculate projected GPA
  const calculateGPA = useCallback(() => {
    const courses = Array.from(selectedCourses.values());
    if (courses.length === 0) return "0.00";

    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };

    const totalPoints = courses.reduce((sum, course) => {
      return sum + (gradePoints[course.grade] || 0) * course.credits;
    }, 0);

    return (totalPoints / totalCredits).toFixed(2);
  }, [selectedCourses, totalCredits]);

  // Check if a course is selected
  const isCourseSelected = useCallback((courseId: string) => {
    return selectedCourses.has(courseId);
  }, [selectedCourses]);

  // Check if a course is completed
  const isCourseCompleted = useCallback((courseId: string) => {
    return completedCourses.has(courseId);
  }, [completedCourses]);

  // Save selected courses
  const handleSave = useCallback(() => {
    const coursesArray = Array.from(selectedCourses.values());
    onSave(coursesArray);
  }, [selectedCourses, onSave]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedCourses(new Map());
  }, []);

  return {
    // State
    selectedCourses: Array.from(selectedCourses.values()),
    selectedCoursesMap: selectedCourses,
    completedCourses,

    // Calculated values
    totalCredits,
    projectedGPA: calculateGPA(),
    selectedCount: selectedCourses.size,

    // Actions
    handleCourseToggle,
    handleGradeChange,
    handleRemoveCourse,
    handleSave,
    clearSelections,

    // Checkers
    isCourseSelected,
    isCourseCompleted
  };
}