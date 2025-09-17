"use client";

import { useMemo } from "react";

interface Course {
  code: string;
  name?: string;
  title?: string;
  credits?: number;
  semester?: string;
  grade?: string;
  status?: 'completed' | 'scheduled';
}

interface SemesterData {
  label: string;
  status: "completed" | "current" | "upcoming" | "future";
  credits: number;
  courseCount: number;
  courses?: any[];
  gpa?: number;
  isSummer?: boolean;
}

export function useSemesterTimeline(
  completedCourses: Map<string, Course>,
  scheduledCourses: Map<string, Course>,
  allSemesterSchedules: Map<string, Course[]>,
  enrollmentYear: number | null,
  graduationYear: number | null
) {
  const semesterTimelineData = useMemo(() => {
    const semesters: SemesterData[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    let currentSem;
    if (currentMonth >= 1 && currentMonth <= 5) {
      currentSem = `Spring ${currentYear}`;
    } else if (currentMonth >= 6 && currentMonth <= 7) {
      currentSem = `Summer ${currentYear}`;
    } else if (currentMonth >= 8 && currentMonth <= 12) {
      currentSem = `Fall ${currentYear}`;
    } else {
      currentSem = `Fall ${currentYear}`;
    }

    const startYear = enrollmentYear || (currentYear - 1);

    for (let year = startYear; year <= (graduationYear || currentYear + 2); year++) {
      const fallSem = `Fall ${year}`;
      let fallStatus;
      if (fallSem === currentSem) {
        fallStatus = 'current';
      } else if (year < currentYear) {
        fallStatus = 'completed';
      } else if (year === currentYear && currentMonth >= 1 && currentMonth <= 7) {
        fallStatus = 'upcoming';
      } else {
        fallStatus = 'upcoming';
      }

      semesters.push({
        label: fallSem,
        status: fallStatus as "completed" | "current" | "upcoming" | "future",
        credits: 0,
        courseCount: 0
      });

      if (year < (graduationYear || currentYear + 2)) {
        const springSem = `Spring ${year + 1}`;
        let springStatus;
        if (springSem === currentSem) {
          springStatus = 'current';
        } else if (year + 1 < currentYear) {
          springStatus = 'completed';
        } else if (year + 1 === currentYear && currentMonth > 5) {
          springStatus = 'completed';
        } else {
          springStatus = 'upcoming';
        }

        semesters.push({
          label: springSem,
          status: springStatus as "completed" | "current" | "upcoming" | "future",
          credits: 0,
          courseCount: 0
        });

        const summerSem = `Summer ${year + 1}`;
        let summerStatus;
        if (summerSem === currentSem) {
          summerStatus = 'current';
        } else if (year + 1 < currentYear) {
          summerStatus = 'completed';
        } else if (year + 1 === currentYear && currentMonth > 7) {
          summerStatus = 'completed';
        } else {
          summerStatus = 'upcoming';
        }

        semesters.push({
          label: summerSem,
          status: summerStatus as "completed" | "current" | "upcoming" | "future",
          credits: 0,
          courseCount: 0,
          isSummer: true
        } as any);
      }
    }

    semesters.forEach(semester => {
      const semesterCoursesMap = new Map();

      completedCourses.forEach((course) => {
        if (course.semester === semester.label) {
          if (!semesterCoursesMap.has(course.code)) {
            semester.courseCount++;
            semester.credits += course.credits || 3;
            semesterCoursesMap.set(course.code, {
              code: course.code,
              name: course.name || course.title,
              credits: course.credits || 3,
              grade: course.grade
            });
          }
        }
      });

      scheduledCourses.forEach((course) => {
        if (course.semester === semester.label) {
          if (!semesterCoursesMap.has(course.code)) {
            semester.courseCount++;
            semester.credits += course.credits || 3;
            semesterCoursesMap.set(course.code, {
              code: course.code,
              name: course.name || course.title,
              credits: course.credits || 3,
              grade: undefined
            });
          }
        }
      });

      const semesterSchedule = allSemesterSchedules.get(semester.label);
      if (semesterSchedule) {
        semesterSchedule.forEach(course => {
          if (!semesterCoursesMap.has(course.code)) {
            semester.courseCount++;
            semester.credits += course.credits || 3;
            semesterCoursesMap.set(course.code, {
              code: course.code,
              name: course.name || course.title,
              credits: course.credits || 3,
              grade: undefined
            });
          }
        });
      }

      semester.courses = Array.from(semesterCoursesMap.values());

      const semesterCourses = semester.courses || [];
      if (semesterCourses.some(c => c.grade)) {
        const gradePoints: { [key: string]: number } = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };

        const gradedCourses = semesterCourses.filter(c => c.grade);
        const totalPoints = gradedCourses.reduce((sum, course) => {
          return sum + (gradePoints[course.grade] || 0) * course.credits;
        }, 0);
        const totalCredits = gradedCourses.reduce((sum, course) => sum + course.credits, 0);

        if (totalCredits > 0) {
          semester.gpa = Number((totalPoints / totalCredits).toFixed(2));
        }
      }
    });

    return semesters;
  }, [completedCourses, scheduledCourses, allSemesterSchedules, enrollmentYear, graduationYear]);

  return {
    semesterTimelineData
  };
}