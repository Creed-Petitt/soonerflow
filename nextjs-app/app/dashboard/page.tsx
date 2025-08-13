"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DegreeRequirementsTable from "@/components/degree-requirements-table";
import { ProgressRadialChart } from "@/components/progress-radial-chart";
import { AcademicProgressChart } from "@/components/academic-progress-chart";
import { 
  TextRevealCard,
  TextRevealCardDescription,
  TextRevealCardTitle,
} from "@/components/ui/text-reveal-card";
import PrerequisiteVisualizer from "@/components/prerequisite-flow/prerequisite-visualizer";
import { generateStudentSemesters, type Semester } from "@/lib/semester-utils";
// Removed useCourseStore - fetching data directly now
import { 
  Sparkles, 
  X,
  Expand,
  Plus,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [flowFullscreen, setFlowFullscreen] = useState(false);
  const [viewState, setViewState] = useState<'both' | 'semester' | 'flow'>('semester');
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Map<string, Set<string>>>(new Map());
  const [selectedGrade, setSelectedGrade] = useState<Map<string, string>>(new Map());
  const [hiddenSemesters, setHiddenSemesters] = useState<Set<string>>(new Set());
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  
  // Dynamic data from backend
  const [creditsCompleted, setCreditsCompleted] = useState(0);
  const [totalCredits, setTotalCredits] = useState(120);
  const [gpa, setGpa] = useState<number | null>(null);
  const [majorName, setMajorName] = useState<string | null>(null);
  const [enrollmentYear, setEnrollmentYear] = useState<number | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Calculate current year based on enrollment
  const currentYear = enrollmentYear ? Math.min(4, new Date().getFullYear() - enrollmentYear + 1) : 1;
  
  // Dynamic semester generation
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [additionalSemesters, setAdditionalSemesters] = useState(0); // For adding extra semesters if needed
  
  // State for completed and scheduled courses
  const [completedCourses, setCompletedCourses] = useState<Map<string, any>>(new Map());
  const [scheduledCourses, setScheduledCourses] = useState<Map<string, any>>(new Map());
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Load completed courses from backend when session is available
  useEffect(() => {
    const loadCompletedCourses = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            const coursesMap = new Map();
            data.completedCourses.forEach((course: any) => {
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
        } finally {
          setLoadingCourses(false);
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
  
  // Organize courses by semester
  const coursesBySemester = useMemo(() => {
    const organized = new Map<string, any[]>();
    
    console.log('📊 Dashboard - scheduledCourses:', Array.from(scheduledCourses.values()));
    console.log('📊 Dashboard - completedCourses:', Array.from(completedCourses.values()));
    
    // Add completed courses
    completedCourses.forEach((course, key) => {
      const semester = course.semester || 'Unassigned';
      if (!organized.has(semester)) {
        organized.set(semester, []);
      }
      organized.get(semester)!.push({
        ...course,
        status: 'completed'
      });
    });
    
    // Add scheduled courses
    scheduledCourses.forEach((course, key) => {
      const semester = course.semester || 'Spring 2025';
      if (!organized.has(semester)) {
        organized.set(semester, []);
      }
      organized.get(semester)!.push({
        ...course,
        status: 'scheduled'
      });
    });
    
    console.log('📊 Dashboard - coursesBySemester:', Array.from(organized.entries()));
    console.log('📊 Dashboard - Spring 2025 courses:', organized.get('Spring 2025'));
    
    return organized;
  }, [completedCourses, scheduledCourses]);
  
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
        console.log('✅ Dashboard data loaded:', data);
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
        // Set fallback values - but don't hardcode fake credits
        setCreditsCompleted(0);
        setTotalCredits(120);
        setGpa(null);
        setMajorName(null);
        setEnrollmentYear(null);
        setGraduationYear(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback values on error - but don't hardcode fake credits
      setCreditsCompleted(0);
      setTotalCredits(120);
      setGpa(null);
      setMajorName(null);
      setEnrollmentYear(null);
      setGraduationYear(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]); // Only depend on email, not entire session object
  
  // Load available courses for the selector
  useEffect(() => {
    const fetchCourses = async () => {
      if (!session?.user?.githubId) return;
      
      try {
        // First get user's major
        const userResponse = await fetch(`/api/users/${session.user.githubId}`);
        if (!userResponse.ok) {
          console.error('Failed to fetch user data');
          return;
        }
        const userData = await userResponse.json();
        
        if (!userData.major) {
          console.log('User has no major selected');
          return;
        }
        
        // Then fetch major courses
        const coursesResponse = await fetch(`/api/major-courses?major_name=${encodeURIComponent(userData.major)}`);
        if (coursesResponse.ok) {
          const majorCourses = await coursesResponse.json();
          
          // Transform to simpler format
          const transformed = majorCourses.map((course: any) => ({
            id: `${course.subject}-${course.courseNumber}`,
            code: `${course.subject} ${course.courseNumber}`,
            name: course.title || `${course.subject} ${course.courseNumber}`,
            credits: course.credits || 3,
            category: course.category
          }));
          
          setAvailableCourses(transformed);
        }
      } catch (error) {
        console.error('Error fetching available courses:', error);
      }
    };
    
    fetchCourses();
  }, [session?.user?.githubId]);

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
  
  // Load hidden semesters from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('hiddenSemesters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHiddenSemesters(new Set(parsed));
      } catch (e) {
        console.error('Failed to load hidden semesters:', e);
      }
    }
  }, []);

  // Save hidden semesters to localStorage whenever they change
  useEffect(() => {
    if (hiddenSemesters.size > 0) {
      localStorage.setItem('hiddenSemesters', JSON.stringify(Array.from(hiddenSemesters)));
    } else {
      localStorage.removeItem('hiddenSemesters');
    }
  }, [hiddenSemesters]);

  // Generate semesters for 2022-2027 timeline (10 semesters)
  useEffect(() => {
    // Check if user has any summer courses
    const hasSummerCourses = Array.from(completedCourses.values()).some(
      course => course.semester?.toLowerCase().includes('summer')
    ) || Array.from(scheduledCourses.values()).some(
      course => course.semester?.toLowerCase().includes('summer')
    );
    
    // Generate 2022-2027 timeline as requested by user
    const generatedSemesters = generateStudentSemesters(
      2022, // Start year
      2027, // End year
      hasSummerCourses // Include summer only if user has summer courses
    );
    
    // Filter out hidden semesters
    const visibleSemesters = generatedSemesters.filter(
      semester => !hiddenSemesters.has(semester.label)
    );
    
    setSemesters(visibleSemesters);
  }, [additionalSemesters, completedCourses, scheduledCourses, hiddenSemesters]);

  // Listen for course added events to trigger re-render
  useEffect(() => {
    const handleCourseAdded = () => {
      console.log('Course added to schedule event received');
      // Force a re-render by updating state
      setAdditionalSemesters(prev => prev);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('courseAddedToSchedule', handleCourseAdded);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('courseAddedToSchedule', handleCourseAdded);
      }
    };
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <CustomNavbar />
      
      <main className="px-6 py-4">
        {/* Main Layout - Now 3-9 split */}
        {loading ? (
          // Show nothing while loading - completely empty
          <div className="grid grid-cols-12 gap-x-4 items-start">
            <div className="col-span-3" />
            <div className="col-span-9 h-[455px]">
              <DegreeRequirementsTable />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-x-4 items-start">
            
            {/* Left Column - Progress Overview (wider) */}
            <div className="col-span-3 flex flex-col gap-3">
              {/* Progress Chart Card */}
              <div className="h-[200px]">
                <ProgressRadialChart 
                  creditsCompleted={creditsCompleted}
                  totalCredits={totalCredits}
                />
              </div>

              {/* GPA Display with Text Reveal Effect */}
              <div className="flex justify-center -mt-[55px] -ml-[3px]">
                <TextRevealCard
                  text="GPA"
                  revealText={gpa ? gpa.toFixed(2) : "N/A"}
                  className="w-[150px]"
                />
              </div>

              {/* Graduation Status */}
              <div className="min-h-[160px]">
                <AcademicProgressChart 
                  currentYear={currentYear}
                  graduationDate={graduationYear ? `May ${graduationYear}` : "TBD"}
                  enrollmentYear={enrollmentYear}
                  graduationYear={graduationYear}
                />
              </div>

            </div>

            {/* Center Column - Requirements Table (truncated to align with Fall 2026 card) */}
            <div className="col-span-8 h-[380px] pr-4">
              <DegreeRequirementsTable />
            </div>
            
            {/* Right Column - Empty space to maintain alignment */}
            <div className="col-span-1"></div>
          </div>
        )}

        {/* Floating Action Button for AI Advisor */}
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          onClick={() => setAiDrawerOpen(true)}
        >
          <Sparkles className="h-6 w-6" />
        </Button>

        {/* AI Advisor Slide-out Drawer */}
        {aiDrawerOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setAiDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[450px] bg-background border-l shadow-xl z-50 transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Advisor
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setAiDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Get Next Semester Plan
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Analyze Graduation Progress
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Suggest Electives
                    </Button>
                    
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">AI Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Click any of the buttons above to get personalized recommendations based on your degree progress and course history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hidden Semesters Reset Button */}
        {hiddenSemesters.size > 0 && (
          <div className="mt-2 flex justify-end px-14">
            <button
              onClick={() => setHiddenSemesters(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Show {hiddenSemesters.size} hidden semester{hiddenSemesters.size > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Clean Semester Carousel - Moved up to eliminate scrolling */}
        <div className="mt-4">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full max-w-[calc(100vw-200px)] mx-auto px-14"
          >
            <CarouselContent>
              {semesters.map((semester, index) => {
                const hasClasses = coursesBySemester.get(semester.label)?.length > 0;
                const isCurrentSemester = semester.label === currentSemester;
                return (
                  <CarouselItem key={semester.value} className="md:basis-1/8 lg:basis-1/8">
                    <div className={`bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow h-[400px] flex flex-col ${
                      isCurrentSemester ? 'border-2 border-red-500/40 shadow-red-500/20' : ''
                    }`}>
                      <div className="p-3 border-b flex items-center justify-between">
                        <p className="text-sm font-bold text-center flex-1">{semester.label}</p>
                        {!hasClasses && (
                          <button 
                            onClick={() => {
                              setHiddenSemesters(prev => {
                                const newSet = new Set(prev);
                                newSet.add(semester.label);
                                return newSet;
                              });
                            }}
                            className="text-muted-foreground hover:text-destructive w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto space-y-2">
                        {/* Display actual courses for this semester */}
                        {coursesBySemester.get(semester.label)?.map((course) => {
                          const isCompleted = course.status === 'completed';
                          return (
                            <div 
                              key={course.id || course.code}
                              className="p-2 rounded border text-xs relative bg-muted/30 border-muted-foreground/20 hover:bg-muted/40"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-foreground">{course.code}</div>
                                  <div className="text-muted-foreground text-xs">
                                    {course.credits || 3} credits
                                    {isCompleted && course.grade && (
                                      <span className="ml-2 font-semibold">{course.grade}</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (isCompleted) {
                                      // Remove from completed courses
                                      // Remove from completed courses
                                      const newCompleted = new Map(completedCourses);
                                      newCompleted.delete(course.id || course.code);
                                      setCompletedCourses(newCompleted);
                                      
                                      // TODO: API call to remove from backend
                                      if (session?.user?.email) {
                                        fetch(`/api/user/courses/complete/${course.id || course.code}?user_email=${encodeURIComponent(session.user.email)}`, {
                                          method: 'DELETE'
                                        });
                                      }
                                      
                                      // Update backend to remove completed status
                                      if (session?.user?.email) {
                                        try {
                                          const response = await fetch(
                                            `/api/user/courses/complete/${encodeURIComponent(course.code)}?user_email=${encodeURIComponent(session.user.email)}`,
                                            { method: 'DELETE' }
                                          );
                                          if (!response.ok) {
                                            console.error('Failed to remove course:', await response.text());
                                          }
                                        } catch (error) {
                                          console.error('Failed to update backend:', error);
                                        }
                                      }
                                      
                                      // Trigger event to update table
                                      window.dispatchEvent(new CustomEvent('courseRemoved'));
                                    } else {
                                      // Remove from scheduled courses
                                      // Remove from scheduled courses
                                      const newScheduled = new Map(scheduledCourses);
                                      newScheduled.delete(course.id || course.code);
                                      setScheduledCourses(newScheduled);
                                    }
                                    
                                    // Trigger re-render
                                    window.dispatchEvent(new CustomEvent('courseAddedToSchedule'));
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors text-sm font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <button 
                          className="w-full p-2 border-2 border-dashed border-muted-foreground/30 rounded text-muted-foreground hover:border-muted-foreground/50 transition-colors"
                          onClick={() => {
                            setSelectedSemester(semester.label);
                            setShowCourseSelector(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Fullscreen Planning Tools Modal */}
        {flowFullscreen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-background z-50">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-b z-10 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">Planning Tools</h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewState === 'semester' ? 'default' : 'ghost'}
                      onClick={() => setViewState('semester')}
                    >
                      Semester Planner
                    </Button>
                    <Button
                      size="sm"
                      variant={viewState === 'flow' ? 'default' : 'ghost'}
                      onClick={() => setViewState('flow')}
                    >
                      Prerequisite Flow
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFlowFullscreen(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close Fullscreen
                </Button>
              </div>
              
              {/* Full screen content */}
              <div className="absolute inset-0 top-16 p-6">
                {viewState === 'semester' ? (
                  <div className="h-full flex gap-4 overflow-x-auto">
                    {semesters.map((semester) => (
                      <div key={semester.value} className="flex-shrink-0 w-[160px] h-full border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 border-b">
                          <p className="text-sm font-semibold text-center">{semester.label}</p>
                        </div>
                        <div className="p-3 h-[calc(100%-100px)] overflow-y-auto space-y-2">
                          {coursesBySemester.get(semester.label)?.map((course) => (
                            <div 
                              key={course.id || course.code}
                              className={`p-2 rounded border ${
                                course.status === 'completed' 
                                  ? 'bg-green-500/10 border-green-500/20' 
                                  : 'bg-blue-500/10 border-blue-500/20'
                              }`}
                            >
                              <div className="text-sm font-medium">{course.code}</div>
                              <div className="text-xs text-muted-foreground">{course.credits || 3} credits</div>
                            </div>
                          ))}
                          <button 
                            className="w-full p-2 border-2 border-dashed border-muted-foreground/30 rounded text-muted-foreground hover:border-muted-foreground/50 transition-colors"
                            onClick={() => {
                              setSelectedSemester(semester.label);
                              setShowCourseSelector(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                        <div className="p-3 border-t">
                          <p className="text-sm text-center font-medium text-muted-foreground">
                            {coursesBySemester.get(semester.label)?.reduce((sum, course) => sum + (course.credits || 3), 0) || 0} credits
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex-shrink-0 w-[120px] h-full flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdditionalSemesters(prev => prev + 1)}
                        className="w-full h-[120px] flex-col gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">Add<br/>Semester</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <PrerequisiteVisualizer />
                )}
              </div>
            </div>
          </>
        )}

        {/* Course Selector Modal */}
        {showCourseSelector && selectedSemester && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setShowCourseSelector(false)}
            />
            
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] bg-background border rounded-lg shadow-xl z-50">
              <div className="flex flex-col h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Add Course to {selectedSemester}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCourseSelector(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                  {/* Search bar */}
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 mb-3 border rounded-md bg-background text-sm"
                    autoFocus
                  />
                  
                  {/* Course list */}
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {availableCourses
                      .filter(course => 
                        searchQuery === '' || 
                        course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        course.name?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .slice(0, 20) // Limit to 20 courses for performance
                      .map((course) => {
                        const isAlreadyScheduled = Array.from(scheduledCourses.values()).some(
                          c => c.code === course.code
                        );
                        const isCompleted = Array.from(completedCourses.values()).some(
                          c => c.code === course.code
                        );
                        
                        return (
                          <div
                            key={course.code}
                            className={`p-3 border rounded-md cursor-pointer transition-colors ${
                              isAlreadyScheduled || isCompleted
                                ? 'opacity-50 cursor-not-allowed bg-muted/20'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              if (!isAlreadyScheduled && !isCompleted) {
                                // Add to scheduled courses
                                const newScheduled = new Map(scheduledCourses);
                                newScheduled.set(course.code, {
                                  id: course.code,
                                  code: course.code,
                                  name: course.name,
                                  credits: course.credits || 3,
                                  semester: selectedSemester
                                });
                                setScheduledCourses(newScheduled);
                                
                                // Trigger re-render
                                window.dispatchEvent(new CustomEvent('courseAddedToSchedule'));
                                setShowCourseSelector(false);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">{course.code}</div>
                                <div className="text-xs text-muted-foreground">{course.name}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {course.credits || 3} cr
                                {(isAlreadyScheduled || isCompleted) && (
                                  <span className="ml-2">✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {availableCourses.filter(course => 
                      searchQuery === '' || 
                      course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No courses found
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t bg-muted/20 rounded-b-lg">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowCourseSelector(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}