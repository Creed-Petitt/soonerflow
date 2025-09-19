"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSchedule } from "@/hooks/use-schedule";

interface Course {
  code: string;
  name?: string;
  title?: string;
  credits?: number;
  semester?: string;
  grade?: string;
  time?: string;
  location?: string;
  instructor?: string;
  status?: 'completed' | 'scheduled';
}

export function useCompletedCourses(onGpaUpdate: (credits: number, gpa: number) => void) {
  const { data: session } = useSession();
  const { scheduledClasses, currentSemester } = useSchedule();

  const [completedCourses, setCompletedCourses] = useState<Map<string, Course>>(new Map());
  const [scheduledCourses, setScheduledCourses] = useState<Map<string, Course>>(new Map());
  const [allSemesterSchedules, setAllSemesterSchedules] = useState<Map<string, Course[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentSemesterName = () => {
    if (!currentSemester) return 'Spring 2025';

    const year = parseInt(currentSemester.substring(0, 4));
    const term = currentSemester.substring(4);

    if (term === '10') {
      return `Fall ${year}`;
    } else if (term === '20') {
      return `Spring ${year + 1}`;
    } else {
      return `Summer ${year + 1}`;
    }
  };

  const currentSemesterName = getCurrentSemesterName();

  useEffect(() => {
    if (scheduledClasses && scheduledClasses.length > 0) {
      const scheduleCourses = scheduledClasses.map((cls: any) => ({
        code: `${cls.subject} ${cls.number}`,
        name: cls.title,
        title: cls.title,
        credits: cls.credits,
        time: cls.time,
        location: cls.location,
        instructor: cls.instructor,
        status: 'scheduled' as const,
        semester: currentSemesterName
      }));

      setScheduledCourses(prevScheduled => {
        const newScheduledCourses = new Map(prevScheduled);
        const currentSem = currentSemesterName;

        Array.from(newScheduledCourses.keys()).forEach(key => {
          if (key.endsWith(`-${currentSem}`)) {
            newScheduledCourses.delete(key);
          }
        });

        scheduleCourses.forEach(course => {
          const key = `${course.code}-${currentSem}`;
          newScheduledCourses.set(key, course);
        });

        return newScheduledCourses;
      });
    } else {
      // Clear scheduled courses for current semester if no classes
      setScheduledCourses(prevScheduled => {
        const newScheduledCourses = new Map(prevScheduled);
        const currentSem = currentSemesterName;

        Array.from(newScheduledCourses.keys()).forEach(key => {
          if (key.endsWith(`-${currentSem}`)) {
            newScheduledCourses.delete(key);
          }
        });

        return newScheduledCourses;
      });
    }

    // Always set loading to false after processing, regardless of whether classes exist
    setIsLoading(false);
  }, [scheduledClasses, currentSemesterName]);

  useEffect(() => {
    const loadCompletedCourses = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            const coursesMap = new Map<string, Course>();
            data.completedCourses.forEach((course: any) => {
              const key = `${course.course_code}-${course.semester_completed}`;
              coursesMap.set(key, {
                code: course.course_code,
                name: course.course_name,
                credits: course.credits,
                grade: course.grade,
                semester: course.semester_completed || course.semester,
                status: 'completed'
              });
            });
            setCompletedCourses(coursesMap);
          }
        } catch (error) {
          console.error('Error loading completed courses:', error);
        }
      }
    };

    loadCompletedCourses();
  }, [session?.user?.email]);

  const calculateGpa = (courses: Map<string, Course>) => {
    const allCourses = Array.from(courses.values());
    const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };

    const totalGradePoints = allCourses.reduce((sum, course) => {
      const points = gradePoints[course.grade || 'F'] || 0;
      return sum + (points * (course.credits || 0));
    }, 0);

    const newGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    return { totalCredits, gpa: Number(newGPA.toFixed(2)) };
  };

  const handleRemoveCourse = async (semester: string, courseCode: string) => {
    try {
      if (!session?.user?.email) {
        console.error('No user email available');
        return;
      }

      const response = await fetch(`/api/user/courses/complete/${encodeURIComponent(courseCode)}?user_email=${encodeURIComponent(session.user.email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const newCompletedCourses = new Map(completedCourses);

        for (const [key, course] of newCompletedCourses.entries()) {
          if (course.code === courseCode && course.semester === semester) {
            newCompletedCourses.delete(key);
          }
        }

        setCompletedCourses(newCompletedCourses);

        const { totalCredits, gpa } = calculateGpa(newCompletedCourses);
        onGpaUpdate(totalCredits, gpa);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coursesCompleted'));
        }
      } else {
        console.error('Failed to remove course');
      }
    } catch (error) {
      console.error('Error removing course:', error);
    }
  };

  const handleCoursesUpdate = async (semester: string, courses: any[]) => {
    try {
      if (!session?.user?.email) {
        console.error('No user email available');
        return;
      }

      const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          semester,
          courses: courses.map(course => ({
            code: course.code,
            name: course.name || course.title || course.code,
            credits: course.credits,
            grade: course.grade
          }))
        })
      });

      if (response.ok) {
        const newCompletedCourses = new Map();

        completedCourses.forEach((course, key) => {
          if (course.semester !== semester) {
            newCompletedCourses.set(key, course);
          }
        });

        courses.forEach(course => {
          const key = `${course.code}-${semester}`;
          newCompletedCourses.set(key, {
            code: course.code,
            name: course.name,
            credits: course.credits,
            grade: course.grade,
            semester,
            status: 'completed'
          });
        });

        setCompletedCourses(newCompletedCourses);

        const { totalCredits, gpa } = calculateGpa(newCompletedCourses);
        onGpaUpdate(totalCredits, gpa);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('coursesCompleted'));
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to save courses:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error saving courses:', error);
    }
  };

  return {
    completedCourses,
    scheduledCourses,
    allSemesterSchedules,
    setAllSemesterSchedules,
    isLoading,
    currentSemesterName,
    handleRemoveCourse,
    handleCoursesUpdate
  };
}