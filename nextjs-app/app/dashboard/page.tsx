"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { StudentProfileCard } from "@/components/dashboard/student-profile-card";
import { GPACard } from "@/components/dashboard/gpa-card";
import { CompactSemesterTimeline } from "@/components/dashboard/compact-semester-timeline";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { DegreeRequirementsWidget } from "@/components/dashboard/degree-requirements-widget";
import { ProfileSetupModal } from "@/components/profile-setup-modal";
import { useSchedule } from "@/hooks/use-schedule";
import { fetchWithAuth } from "@/lib/api-client";
import type { CalendarEvent } from "@/components/event-calendar/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { scheduledClasses, currentSemester } = useSchedule();
  
  // Dynamic data from backend
  const [creditsCompleted, setCreditsCompleted] = useState(0);
  const [totalCredits, setTotalCredits] = useState(120);
  const [gpa, setGpa] = useState<number | null>(null);
  const [majorName, setMajorName] = useState<string | null>(null);
  const [enrollmentYear, setEnrollmentYear] = useState<number | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // State for courses
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
  
  const [completedCourses, setCompletedCourses] = useState<Map<string, Course>>(new Map());
  const [scheduledCourses, setScheduledCourses] = useState<Map<string, Course>>(new Map());
  const [allSemesterSchedules, setAllSemesterSchedules] = useState<Map<string, Course[]>>(new Map());
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Function to parse class time string into calendar events
  const parseTimeToEvents = (classData: any) => {
    if (!classData.time || classData.time === 'TBA') return []
    
    // Parse "MWF 10:00 am-10:50 am" format
    const parts = classData.time.split(' ')
    if (parts.length < 3) return []
    
    const days = parts[0]
    const timeRange = parts.slice(1).join(' ')
    const [startTimeStr, endTimeStr] = timeRange.split('-')
    
    // Parse times
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
    
    // Map day letters to day numbers (0 = Sunday)
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
    
    // Create calendar events for the semester
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

  
  // Real-time sync with scheduler: Update dashboard when scheduledClasses change
  useEffect(() => {
    if (scheduledClasses && scheduledClasses.length > 0) {
      
      // Transform scheduler classes to course format
      const scheduleCourses = scheduledClasses.map((cls: any) => ({
        code: `${cls.subject} ${cls.number}`,
        name: cls.title,
        title: cls.title,
        credits: cls.credits,
        time: cls.time,
        location: cls.location,
        instructor: cls.instructor,
        status: 'scheduled' as const,
        semester: currentSemesterName // Use the schedule context's selected semester
      }));
      
      // Set current semester courses (no longer needed)
      
      // Update scheduled courses map
      setScheduledCourses(prevScheduled => {
        const newScheduledCourses = new Map(prevScheduled);
        const currentSem = currentSemesterName; // Use the schedule context's selected semester
        
        // Remove existing scheduled courses for current semester
        Array.from(newScheduledCourses.keys()).forEach(key => {
          if (key.endsWith(`-${currentSem}`)) {
            newScheduledCourses.delete(key);
          }
        });
        
        // Add updated courses
        scheduleCourses.forEach(course => {
          const key = `${course.code}-${currentSem}`;
          newScheduledCourses.set(key, course);
        });
        
        return newScheduledCourses;
      });
      
      setLoadingCourses(false);
    }
  }, [scheduledClasses]);
  
  // Load active schedule from backend (fallback for initial load)
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
  
  // Load completed courses from backend when session is available
  useEffect(() => {
    const loadCompletedCourses = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            const coursesMap = new Map<string, Course>();
            data.completedCourses.forEach((course: any) => {
              // Use consistent key format: CODE-SEMESTER
              const key = `${course.course_code}-${course.semester_completed}`;
              coursesMap.set(key, {
                id: course.course_code,
                code: course.course_code,
                name: course.course_name,
                credits: course.credits,
                grade: course.grade,
                semester: course.semester_completed || course.semester, // Fix: ensure semester is set
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
  
  // Load all semester schedules (for all semesters, not just current)
  useEffect(() => {
    const loadAllSemesterSchedules = async () => {
      if (!session?.user?.githubId) return;
      
      // Define semesters to load (you can expand this based on enrollmentYear and graduationYear)
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
              // Transform classes to Course format
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
  
  // Use semester from schedule context instead of calculating locally
  const currentSemesterName = useMemo(() => {
    // Convert semester code to name
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
  
  // Helper function for compatibility 
  const getCurrentSemester = () => currentSemesterName;
  
  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    // Wait for session to be loaded
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    
    try {
      // Use API route to avoid CORS issues
      const url = `/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`;
        
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCreditsCompleted(data.creditsCompleted || 0);
        setTotalCredits(data.totalCredits || 120);
        setGpa(data.gpa || null);
        setMajorName(data.majorName || null);
        setEnrollmentYear(data.enrollmentYear || null);
        setGraduationYear(data.graduationYear || null);
        setUserName(session.user.name || null);
        
        // Check if profile is incomplete
        if (!data.majorName || !data.graduationYear) {
          setShowProfileSetup(true);
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
        // Set fallback values
        setCreditsCompleted(0);
        setTotalCredits(120);
        setGpa(null);
        setMajorName(null);
        setEnrollmentYear(null);
        setGraduationYear(null);
        setUserName(session.user?.name || null);
        // Show profile setup for new users
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback values on error
      setCreditsCompleted(0);
      setTotalCredits(120);
      setGpa(null);
      setMajorName(null);
      setEnrollmentYear(null);
      setGraduationYear(null);
      setUserName(session.user?.name || null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, session?.user?.name]); // Depend on email and name
  
  // Load current semester courses
  useEffect(() => {
    if (!loadingCourses) {
      const current = currentSemesterName;
      const coursesForCurrentSemester = [];
      
      // Check scheduled courses for current semester
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
      
      // Check completed courses for current semester (in case student is retaking)
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
      
      // Current semester courses are now tracked differently
    }
  }, [completedCourses, scheduledCourses, currentSemesterName, loadingCourses]);

  // Load dashboard data once when session is available (FIXED - proper caching)
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false)
  
  useEffect(() => {
    if (!session?.user?.email || hasLoadedDashboard) {
      if (!hasLoadedDashboard && !session?.user?.email) {
        setLoading(false)
      }
      return
    }
    
    setHasLoadedDashboard(true)
    fetchDashboardData();
  }, [session?.user?.email, hasLoadedDashboard, fetchDashboardData]);
  
  // Listen for course completion events (FIXED - only when needed)
  useEffect(() => {
    if (!hasLoadedDashboard) return
    
    const handleCourseCompletion = () => {
      setHasLoadedDashboard(false) // Allow reload on completion
    };
    
    // Listen for custom event
    if (typeof window !== 'undefined') {
      window.addEventListener('coursesCompleted', handleCourseCompletion);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('coursesCompleted', handleCourseCompletion);
      }
    };
  }, [hasLoadedDashboard]);
  
  // Generate comprehensive semester data for timeline
  const semesterTimelineData = useMemo(() => {
    const semesters = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Determine current semester (matching schedule-context logic)
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
    
    // If no enrollment year, default to current year minus 1
    const startYear = enrollmentYear || (currentYear - 1);
    
    // Generate all semesters from enrollment to graduation
    for (let year = startYear; year <= (graduationYear || currentYear + 2); year++) {
      // Fall semester
      const fallSem = `Fall ${year}`;
      let fallStatus;
      if (fallSem === currentSem) {
        fallStatus = 'current';
      } else if (year < currentYear) {
        fallStatus = 'completed';
      } else if (year === currentYear && currentMonth >= 1 && currentMonth <= 7) {
        // Fall of current year is upcoming if we're in Spring/Summer
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
      
      // Spring semester (following year)
      if (year < (graduationYear || currentYear + 2)) {
        const springSem = `Spring ${year + 1}`;
        let springStatus;
        if (springSem === currentSem) {
          springStatus = 'current';
        } else if (year + 1 < currentYear) {
          springStatus = 'completed';
        } else if (year + 1 === currentYear && currentMonth > 5) {
          // Spring is over after May
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
        
        // Summer semester - ALWAYS generate but mark as optional
        const summerSem = `Summer ${year + 1}`;
        let summerStatus;
        if (summerSem === currentSem) {
          summerStatus = 'current';
        } else if (year + 1 < currentYear) {
          summerStatus = 'completed';
        } else if (year + 1 === currentYear && currentMonth > 7) {
          // Summer is over after July
          summerStatus = 'completed';
        } else {
          summerStatus = 'upcoming';
        }
        
        semesters.push({
          label: summerSem,
          status: summerStatus as "completed" | "current" | "upcoming" | "future",
          credits: 0,
          courseCount: 0,
          isSummer: true  // Mark as summer for filtering
        } as SemesterData & { isSummer: boolean });
      }
    }
    
    // Count courses and credits for each semester
    semesters.forEach(semester => {
      // Use a Map to ensure unique courses by code
      const semesterCoursesMap = new Map();
      
      completedCourses.forEach((course) => {
        if (course.semester === semester.label) {
          // Use course code as key to prevent duplicates
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
      
      // Add scheduled courses from the current scheduler view
      scheduledCourses.forEach((course) => {
        if (course.semester === semester.label) {
          // Only add if not already in completed courses
          if (!semesterCoursesMap.has(course.code)) {
            semester.courseCount++;
            semester.credits += course.credits || 3;
            semesterCoursesMap.set(course.code, {
              code: course.code,
              name: course.name || course.title,
              credits: course.credits || 3,
              grade: undefined // No grade for scheduled courses
            });
          }
        }
      });
      
      // Add scheduled courses from ALL semester schedules (loaded from backend)
      const semesterSchedule = allSemesterSchedules.get(semester.label);
      if (semesterSchedule) {
        semesterSchedule.forEach(course => {
          // Only add if not already in map
          if (!semesterCoursesMap.has(course.code)) {
            semester.courseCount++;
            semester.credits += course.credits || 3;
            semesterCoursesMap.set(course.code, {
              code: course.code,
              name: course.name || course.title,
              credits: course.credits || 3,
              grade: undefined // No grade for scheduled courses
            });
          }
        });
      }
      
      // Convert Map to array for semester data
      semester.courses = Array.from(semesterCoursesMap.values());
      
      // Calculate semester GPA for completed courses
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

  // Handle removing a completed course
  const handleRemoveCourse = async (semester: string, courseCode: string) => {
    try {
      if (!session?.user?.email) {
        console.error('No user email available');
        return;
      }

      // Call backend to remove the course
      const response = await fetch(`/api/user/courses/complete/${encodeURIComponent(courseCode)}?user_email=${encodeURIComponent(session.user.email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local state - need to find and remove the course by matching code and semester
        const newCompletedCourses = new Map(completedCourses);
        
        // Find and remove all entries that match this course code and semester
        for (const [key, course] of newCompletedCourses.entries()) {
          if (course.code === courseCode && course.semester === semester) {
            newCompletedCourses.delete(key);
          }
        }
        
        setCompletedCourses(newCompletedCourses);

        // Recalculate GPA and credits
        const allCourses = Array.from(newCompletedCourses.values());
        const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
        setCreditsCompleted(totalCredits);

        // Calculate GPA
        const gradePoints: { [key: string]: number } = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };
        
        const totalGradePoints = allCourses.reduce((sum, course) => {
          const points = gradePoints[course.grade || 'F'] || 0;
          return sum + (points * (course.credits || 0));
        }, 0);
        
        const newGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        setGpa(Number(newGPA.toFixed(2)));

        // Trigger re-render of dashboard
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

  // Handle adding completed courses
  const handleCoursesUpdate = async (semester: string, courses: any[]) => {
    try {
      if (!session?.user?.email) {
        console.error('No user email available');
        return;
      }

      // Save courses to backend
      const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          semester,
          courses: courses.map(course => ({
            code: course.code,
            name: course.name || course.title || course.code, // Fallback to code if name missing
            credits: course.credits,
            grade: course.grade
          }))
        })
      });
      
      if (response.ok) {
        // Create a completely new Map to ensure React detects the change
        const newCompletedCourses = new Map();
        
        // First, copy all courses that are NOT from this semester
        completedCourses.forEach((course, key) => {
          if (course.semester !== semester) {
            newCompletedCourses.set(key, course);
          }
        });
        
        // Then add only the new courses for this semester
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
        
        // Sync with scheduler - trigger migration for this user
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

        // Recalculate GPA and credits
        const allCourses = Array.from(newCompletedCourses.values());
        const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
        setCreditsCompleted(totalCredits);

        // Calculate GPA
        const gradePoints: { [key: string]: number } = {
          'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
        };
        
        const totalGradePoints = allCourses.reduce((sum, course) => {
          const points = gradePoints[course.grade || 'F'] || 0;
          return sum + (points * (course.credits || 0));
        }, 0);
        
        const newGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        setGpa(Number(newGPA.toFixed(2)));

        // Trigger custom event to refresh dashboard
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomNavbar />
      
      {/* Profile Setup Modal for new users */}
      <ProfileSetupModal 
        isOpen={showProfileSetup}
        onComplete={() => setShowProfileSetup(false)}
      />
      
      <main className="flex-1 flex flex-col justify-start lg:justify-center max-w-7xl mx-auto px-6 py-6 w-full">
        {!loading && (
          <>
            {/* Professional Two-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
              
              {/* MAIN COLUMN (70% - Left Side) */}
              <div className="space-y-6">
                {/* Student Profile and GPA Cards */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <div className="flex-1">
                    <StudentProfileCard
                      userName={userName}
                      majorName={majorName}
                      graduationYear={graduationYear}
                      gpa={gpa}
                      creditsCompleted={creditsCompleted}
                      totalCredits={totalCredits}
                      academicStanding={gpa && gpa < 2.0 ? 'warning' : 'good'}
                    />
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <GPACard gpa={gpa} />
                  </div>
                </div>

                {/* Academic Timeline */}
                <CompactSemesterTimeline
                  semesters={semesterTimelineData}
                  onCoursesUpdate={handleCoursesUpdate}
                  onRemoveCourse={handleRemoveCourse}
                />
              </div>

              {/* ACTION COLUMN (30% - Right Side) */}
              <div className="space-y-6">
                {/* Quick Actions without title */}
                <QuickActionsPanel />
                
                {/* Degree Requirements Table */}
                <DegreeRequirementsWidget />
              </div>
            </div>
          </>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}