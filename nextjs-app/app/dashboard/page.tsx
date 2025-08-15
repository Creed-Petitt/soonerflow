"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { StudentProfileCard } from "@/components/dashboard/student-profile-card";
import { GPACard } from "@/components/dashboard/gpa-card";
import { DashboardCalendarWidget } from "@/components/dashboard/dashboard-calendar-widget";
import { CompactSemesterTimeline } from "@/components/dashboard/compact-semester-timeline";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { useSchedule } from "@/hooks/use-schedule";
import type { CalendarEvent } from "@/components/event-calendar/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { scheduledClasses } = useSchedule();
  
  // Dynamic data from backend
  const [creditsCompleted, setCreditsCompleted] = useState(0);
  const [totalCredits, setTotalCredits] = useState(120);
  const [gpa, setGpa] = useState<number | null>(null);
  const [majorName, setMajorName] = useState<string | null>(null);
  const [, setEnrollmentYear] = useState<number | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  
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
  
  const [currentSemesterCourses, setCurrentSemesterCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Map<string, Course>>(new Map());
  const [scheduledCourses] = useState<Map<string, Course>>(new Map());
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

  // Convert scheduled classes to calendar events for the dashboard widget
  const calendarEvents = useMemo(() => {
    const allEvents: CalendarEvent[] = []
    
    scheduledClasses.forEach(cls => {
      const events = parseTimeToEvents(cls)
      allEvents.push(...events)
    })
    
    return allEvents
  }, [scheduledClasses])
  
  // Load active schedule from backend
  useEffect(() => {
    const loadActiveSchedule = async () => {
      if (session?.user?.githubId) {
        try {
          // Fetch user's active schedule with real class data
          const response = await fetch(`/api/users/${session.user.githubId}/active-schedule`);
          if (response.ok) {
            const data = await response.json();
            
            // Transform schedule data to course format
            const scheduleCourses = data.classes.map((cls: any) => ({
              code: `${cls.subject} ${cls.number}`,
              name: cls.title,
              title: cls.title,
              credits: cls.credits,
              time: cls.time,
              location: cls.location,
              instructor: cls.instructor,
              status: 'scheduled' as const
            }));
            
            setCurrentSemesterCourses(scheduleCourses);
            console.log('✅ Active schedule loaded:', scheduleCourses);
          }
        } catch (error) {
          console.error('Error loading active schedule:', error);
        } finally {
          setLoadingCourses(false);
        }
      }
    };
    
    loadActiveSchedule();
  }, [session?.user?.githubId]);
  
  // Load completed courses from backend when session is available
  useEffect(() => {
    const loadCompletedCourses = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            const coursesMap = new Map<string, Course>();
            data.completedCourses.forEach((course: Course) => {
              coursesMap.set(course.course_code, {
                id: course.course_code,
                code: course.course_code,
                grade: course.grade,
                semester: course.semester
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
  
  // Determine current semester based on today's date
  const getCurrentSemester = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();
    
    if (month >= 1 && month <= 5) {
      return `Spring ${year}`;
    } else if (month >= 6 && month <= 7) {
      return `Summer ${year}`;
    } else {
      return `Fall ${year}`;
    }
  };
  
  const currentSemester = getCurrentSemester();
  
  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    // Wait for session to be loaded
    if (!session?.user?.email) {
      console.log('Waiting for session...');
      setLoading(false);
      return;
    }
    
    try {
      // Use API route to avoid CORS issues
      const url = `/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`;
      console.log('Fetching dashboard for:', session.user.email);
        
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
        console.log('✅ Dashboard data loaded:', data);
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
      const current = currentSemester;
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
      
      setCurrentSemesterCourses(coursesForCurrentSemester);
    }
  }, [completedCourses, scheduledCourses, currentSemester, loadingCourses]);

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
      console.log('🔄 Course completed event received, refreshing dashboard...');
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
  
  // Generate key semester data for timeline
  const semesterTimelineData = useMemo(() => {
    const semesters = [];
    const current = currentSemester;
    const currentYear = new Date().getFullYear();
    
    // Previous semester (completed)
    const prevSemester = current.includes('Fall') 
      ? `Spring ${currentYear}` 
      : `Fall ${currentYear - 1}`;
    
    // Next semester (upcoming)
    const nextSemester = current.includes('Spring')
      ? `Fall ${currentYear}`
      : `Spring ${currentYear + 1}`;
    
    // Graduation semester
    const gradSemester = graduationYear ? `Spring ${graduationYear}` : 'Spring 2027';
    
    // Count courses and credits for each
    const getCourseData = (sem: string) => {
      let count = 0;
      let credits = 0;
      
      completedCourses.forEach((course) => {
        if (course.semester === sem) {
          count++;
          credits += course.credits || 3;
        }
      });
      
      scheduledCourses.forEach((course) => {
        if (course.semester === sem) {
          count++;
          credits += course.credits || 3;
        }
      });
      
      return { count, credits };
    };
    
    const prevData = getCourseData(prevSemester);
    const currentData = getCourseData(current);
    const nextData = getCourseData(nextSemester);
    const gradData = getCourseData(gradSemester);
    
    semesters.push({
      label: prevSemester,
      status: 'completed' as const,
      credits: prevData.credits,
      courseCount: prevData.count
    });
    
    semesters.push({
      label: current,
      status: 'current' as const,
      credits: currentData.credits,
      courseCount: currentData.count
    });
    
    semesters.push({
      label: nextSemester,
      status: 'upcoming' as const,
      credits: nextData.credits,
      courseCount: nextData.count
    });
    
    // Only add graduation semester if it's different from next semester
    if (gradSemester !== nextSemester && gradSemester !== current) {
      semesters.push({
        label: gradSemester,
        status: 'future' as const,
        credits: gradData.credits,
        courseCount: gradData.count
      });
    }
    
    return semesters;
  }, [completedCourses, scheduledCourses, currentSemester, graduationYear]);



  return (
    <div className="h-screen bg-background flex flex-col">
      <CustomNavbar />
      
      <main className="max-w-7xl mx-auto px-1 py-6">
        {!loading && (
          <>
            {/* Professional Two-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
              
              {/* MAIN COLUMN (70% - Left Side) */}
              <div className="space-y-6">
                {/* Student Profile and GPA Cards */}
                <div className="flex gap-4 items-stretch">
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
                  <div className="flex">
                    <GPACard gpa={gpa} />
                  </div>
                </div>

                {/* Academic Timeline */}
                <CompactSemesterTimeline
                  semesters={semesterTimelineData}
                />
              </div>

              {/* ACTION COLUMN (30% - Right Side) */}
              <div className="space-y-4">
                {/* Quick Actions - Moved to top */}
                <QuickActionsPanel />

                {/* Today's Schedule - Moved below Quick Actions */}
                <div className="mt-12">
                  <DashboardCalendarWidget
                    events={calendarEvents}
                  />
                </div>
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