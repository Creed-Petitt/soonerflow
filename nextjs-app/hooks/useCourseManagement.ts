"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSchedule } from "@/hooks/use-schedule";
import { fetchWithAuth } from "@/lib/api-client";

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

export function useCourseManagement(enrollmentYear: number | null, graduationYear: number | null, onGpaUpdate: (credits: number, gpa: number) => void) {
  const { data: session } = useSession();
  const { scheduledClasses, currentSemester } = useSchedule();

  const [completedCourses, setCompletedCourses] = useState<Map<string, Course>>(new Map());
  const [scheduledCourses, setScheduledCourses] = useState<Map<string, Course>>(new Map());
  const [allSemesterSchedules, setAllSemesterSchedules] = useState<Map<string, Course[]>>(new Map());
  const [loadingCourses, setLoadingCourses] = useState(true);

  const parseTimeToEvents = (classData: any) => {
    if (!classData.time || classData.time === 'TBA') return []

    const parts = classData.time.split(' ')
    if (parts.length < 3) return []

    const days = parts[0]
    const timeRange = parts.slice(1).join(' ')
    const [startTimeStr, endTimeStr] = timeRange.split('-')

    const parseTime = (timeStr: string) => {
      const cleanTime = timeStr.trim()
      const isPM = cleanTime.includes('pm')
      const isAM = cleanTime.includes('am')
      const timeOnly = cleanTime.replace(/[ap]m/g, '').trim()
      const [hourStr, minStr] = timeOnly.split(':')
      let hour = parseInt(hourStr)
      const min = parseInt(minStr) || 0

      if (isPM && hour !== 12) hour += 12
      if (isAM && hour === 12) hour = 0

      return { hour, min }
    }

    const startTime = parseTime(startTimeStr)
    const endTime = parseTime(endTimeStr)

    const dayMap: { [key: string]: number } = {
      'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5
    }

    const classDays = []
    let i = 0
    while (i < days.length) {
      if (i < days.length - 1 && days.slice(i, i + 2) === 'Th') {
        classDays.push(4)
        i += 2
      } else if (days[i] === 'R') {
        classDays.push(4)
        i++
      } else {
        classDays.push(dayMap[days[i]] || 1)
        i++
      }
    }

    const events = []
    const today = new Date()
    const startOfSemester = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfSemester = new Date(today.getFullYear(), today.getMonth() + 4, 30)

    classDays.forEach(dayOfWeek => {
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

  const currentSemesterName = useMemo(() => {
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
  }, [currentSemester]);

  const getCurrentSemester = () => currentSemesterName;

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

      setLoadingCourses(false);
    }
  }, [scheduledClasses, currentSemesterName]);

  useEffect(() => {
    const loadActiveSchedule = async () => {
      if (session?.user?.githubId && (!scheduledClasses || scheduledClasses.length === 0)) {
        try {
          const response = await fetchWithAuth(`/api/users/${session.user.githubId}/active-schedule`);
          if (response.ok) {
            const data = await response.json();
          }
        } catch (error) {
          console.error('Error loading active schedule:', error);
        } finally {
          setLoadingCourses(false);
        }
      }
    };

    loadActiveSchedule();
  }, [session?.user?.githubId, scheduledClasses]);

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

  useEffect(() => {
    const loadAllSemesterSchedules = async () => {
      if (!session?.user?.githubId) return;

      const semestersToLoad = [
        { code: '202510', name: 'Fall 2025' },
        { code: '202520', name: 'Spring 2026' },
        { code: '202530', name: 'Summer 2026' },
        { code: '202610', name: 'Fall 2026' },
        { code: '202620', name: 'Spring 2027' }
      ];

      const schedules = new Map<string, any[]>();

      for (const semester of semestersToLoad) {
        try {
          const response = await fetchWithAuth(`/api/users/${session.user.githubId}/schedule/${semester.code}`);
          if (response.ok) {
            const data = await response.json();
            if (data.classes && data.classes.length > 0) {
              const courses = data.classes.map((cls: any) => ({
                id: cls.id,
                code: `${cls.subject} ${cls.number}`,
                name: cls.title,
                title: cls.title,
                credits: cls.credits || 3,
                time: cls.time,
                location: cls.location,
                instructor: cls.instructor,
                status: 'scheduled' as const,
                semester: semester.name
              }));
              schedules.set(semester.name, courses);
            }
          }
        } catch (error) {
          console.error(`Error loading schedule for ${semester.name}:`, error);
        }
      }

      setAllSemesterSchedules(schedules);
    };

    loadAllSemesterSchedules();
  }, [session?.user?.githubId]);

  useEffect(() => {
    if (!loadingCourses) {
      const current = currentSemesterName;
      const coursesForCurrentSemester = [];

      scheduledCourses.forEach((course) => {
        if (course.semester === current) {
          coursesForCurrentSemester.push({
            code: course.code,
            name: course.name || course.title,
            credits: course.credits || 3,
            time: course.time,
            location: course.location,
            instructor: course.instructor
          });
        }
      });

      completedCourses.forEach((course) => {
        if (course.semester === current) {
          coursesForCurrentSemester.push({
            code: course.code,
            name: course.name || course.title,
            credits: course.credits || 3,
            time: course.time,
            location: course.location,
            instructor: course.instructor
          });
        }
      });
    }
  }, [completedCourses, scheduledCourses, currentSemesterName, loadingCourses]);

  const semesterTimelineData = useMemo(() => {
    const semesters = [];
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

        const allCourses = Array.from(newCompletedCourses.values());
        const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

        const gradePoints: { [key: string]: number } = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };

        const totalGradePoints = allCourses.reduce((sum, course) => {
          const points = gradePoints[course.grade || 'F'] || 0;
          return sum + (points * (course.credits || 0));
        }, 0);

        const newGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        onGpaUpdate(totalCredits, Number(newGPA.toFixed(2)));

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

        if (session?.user?.githubId) {
          try {
            const migrationResponse = await fetchWithAuth(`/api/users/${session.user.githubId}/migrate-completed-courses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (migrationResponse.ok) {
              const result = await migrationResponse.json();
            }
          } catch (error) {
            console.error('Failed to sync with scheduler:', error);
          }
        }

        const allCourses = Array.from(newCompletedCourses.values());
        const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

        const gradePoints: { [key: string]: number } = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };

        const totalGradePoints = allCourses.reduce((sum, course) => {
          const points = gradePoints[course.grade || 'F'] || 0;
          return sum + (points * (course.credits || 0));
        }, 0);

        const newGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        onGpaUpdate(totalCredits, Number(newGPA.toFixed(2)));

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
    loadingCourses,
    parseTimeToEvents,
    currentSemesterName,
    getCurrentSemester,
    semesterTimelineData,
    handleRemoveCourse,
    handleCoursesUpdate
  };
}