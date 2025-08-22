import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, CheckCircle2, Clock, Calendar, GraduationCap, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { AddCoursesModal } from "./add-courses-modal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSchedule } from "@/contexts/schedule-context";
import { fetchWithAuth } from "@/lib/api-client";

interface SemesterData {
  label: string;
  status: "completed" | "current" | "upcoming" | "future";
  credits: number;
  courseCount: number;
  gpa?: number;
  courses?: Array<{
    code: string;
    name: string;
    credits: number;
    grade?: string;
  }>;
  isGenerated?: boolean; // Flag for dynamically generated summer semesters
}

interface CompactSemesterTimelineProps {
  semesters: SemesterData[];
  onViewAll?: () => void;
  onCoursesUpdate?: (semester: string, courses: any[]) => void;
  onRemoveCourse?: (semester: string, courseCode: string) => void;
}

// localStorage utilities for persistent dismissed summers
const loadDismissedSummers = (githubId: string | undefined): Set<string> => {
  if (typeof window === 'undefined' || !githubId) {
    return new Set();
  }
  
  try {
    const key = `dismissed-summers-${githubId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch (error) {
    console.warn('Failed to load dismissed summers from localStorage:', error);
  }
  
  return new Set();
};

const saveDismissedSummers = (githubId: string | undefined, dismissedSet: Set<string>) => {
  if (typeof window === 'undefined' || !githubId) {
    return;
  }
  
  try {
    const key = `dismissed-summers-${githubId}`;
    const array = Array.from(dismissedSet);
    localStorage.setItem(key, JSON.stringify(array));
  } catch (error) {
    console.warn('Failed to save dismissed summers to localStorage:', error);
  }
};

export function CompactSemesterTimeline({ semesters, onViewAll, onCoursesUpdate, onRemoveCourse }: CompactSemesterTimelineProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setCurrentSemester } = useSchedule();
  
  const [currentIndex, setCurrentIndex] = useState(0); // Start at 0, will be updated
  const semestersToShow = 3;
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [includeSummerSemesters, setIncludeSummerSemesters] = useState(false);
  const [dismissedSummers, setDismissedSummers] = useState<Set<string>>(() => 
    loadDismissedSummers(session?.user?.githubId)
  );
  const [summersWithClasses, setSummersWithClasses] = useState<Set<string>>(new Set());
  const hasCenteredRef = useRef(false); // Track if we've already auto-centered
  const prevSemestersLength = useRef(0); // Track previous semesters length to detect changes
  
  // Initialize summers with classes based on existing data
  useEffect(() => {
    const summersWithCourses = new Set<string>();
    semesters.forEach(semester => {
      if (semester.label.includes('Summer') && semester.courseCount > 0) {
        summersWithCourses.add(semester.label);
      }
    });
    setSummersWithClasses(summersWithCourses);
  }, [semesters]);

  // Load dismissed summers from localStorage when user session becomes available
  useEffect(() => {
    if (session?.user?.githubId) {
      const stored = loadDismissedSummers(session.user.githubId);
      setDismissedSummers(stored);
    }
  }, [session?.user?.githubId]);

  // Auto-save dismissed summers to localStorage whenever they change
  useEffect(() => {
    if (session?.user?.githubId && dismissedSummers.size >= 0) {
      saveDismissedSummers(session.user.githubId, dismissedSummers);
    }
  }, [dismissedSummers, session?.user?.githubId]);
  
  const getStatusIcon = (status: SemesterData["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />;
      case "current":
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />;
      case "upcoming":
        return <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-500" />;
      case "future":
        return <GraduationCap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: SemesterData["status"]) => {
    switch (status) {
      case "completed":
        return "";
      case "current":
        return "ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
      case "upcoming":
        return "";
      case "future":
        return "";
    }
  };

  const getStatusLabel = (status: SemesterData["status"]) => {
    switch (status) {
      case "completed": return "Completed";
      case "current": return "Current Semester";
      case "upcoming": return "Next Semester";
      case "future": return "Graduation Target";
    }
  };

  // Generate summer semester cards between existing semesters
  const generateSummerSemesters = (baseSemesters: SemesterData[]): SemesterData[] => {
    const generatedSummers: SemesterData[] = [];
    
    // Find the range of years from the existing semesters
    const years = new Set<number>();
    baseSemesters.forEach(sem => {
      const match = sem.label.match(/(\d{4})/);
      if (match) {
        years.add(parseInt(match[1]));
      }
    });
    
    const sortedYears = Array.from(years).sort();
    
    // Generate summer semesters for each year in the range
    sortedYears.forEach(year => {
      const summerLabel = `Summer ${year}`;
      
      // Check if this summer already exists in base semesters
      const existsInBase = baseSemesters.some(sem => sem.label === summerLabel);
      
      // Check if this summer was dismissed by user
      const isDismissed = dismissedSummers.has(summerLabel);
      
      // Always add if summer has classes (permanent), or if checkbox is on and not dismissed
      const hasClasses = summersWithClasses.has(summerLabel);
      if (!existsInBase && (hasClasses || (!isDismissed && includeSummerSemesters))) {
        // Determine status based on current date and year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        
        let status: SemesterData["status"];
        if (year < currentYear) {
          status = "completed";
        } else if (year === currentYear && currentMonth > 7) {
          status = "completed";
        } else if (year === currentYear && currentMonth >= 6) {
          status = "current";
        } else {
          status = "upcoming";
        }
        
        generatedSummers.push({
          label: summerLabel,
          status,
          credits: 0,
          courseCount: 0,
          courses: [],
          // Mark as generated so we can handle it differently
          isGenerated: true
        } as SemesterData & { isGenerated: boolean });
      }
    });
    
    return generatedSummers;
  };

  // Generate all semesters - summers are now in base data
  const allSemesters = useMemo(() => {
    // Summers are already in the base semesters data from dashboard
    // No need to generate them anymore
    return [...semesters];
  }, [semesters]);
  
  // Filter out dismissed summers and apply toggle logic
  const filteredSemesters = allSemesters.filter(sem => {
    // If it's a summer semester
    if (sem.label.includes('Summer')) {
      // If toggle is OFF, hide ALL summers
      if (!includeSummerSemesters) return false;
      
      // If toggle is ON, hide only dismissed summers
      if (dismissedSummers.has(sem.label)) return false;
    }
    
    return true;
  });
  
  // Auto-center on current semester on initial load and when semesters change significantly
  useEffect(() => {
    // Reset centering if the number of semesters changed significantly (e.g., user logged in)
    if (prevSemestersLength.current > 0 && Math.abs(filteredSemesters.length - prevSemestersLength.current) > 2) {
      hasCenteredRef.current = false;
    }
    prevSemestersLength.current = filteredSemesters.length;
    
    // Center if we haven't already done so OR if the filtered semesters have changed
    if (filteredSemesters.length > 0) {
      // Find current semester in the FILTERED array
      let targetIdx = filteredSemesters.findIndex(sem => sem.status === "current");
      
      // If no current semester found, find the first upcoming semester
      if (targetIdx === -1) {
        targetIdx = filteredSemesters.findIndex(sem => sem.status === "upcoming");
      }
      
      // If still nothing, find the last completed semester
      if (targetIdx === -1) {
        for (let i = filteredSemesters.length - 1; i >= 0; i--) {
          if (filteredSemesters[i].status === "completed") {
            targetIdx = i;
            break;
          }
        }
      }
      
      // If we found a target and haven't centered yet
      if (targetIdx !== -1 && !hasCenteredRef.current) {
        // Center the target semester (show previous, current, next)
        const centerIndex = Math.max(0, targetIdx - 1);
        // Ensure we don't go past the end when centering
        const finalIndex = Math.min(centerIndex, Math.max(0, filteredSemesters.length - 3));
        setCurrentIndex(finalIndex);
        hasCenteredRef.current = true; // Mark as centered
      }
    }
  }, [filteredSemesters]);
  
  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1)); // Changed from semestersToShow to 1
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(filteredSemesters.length - semestersToShow, currentIndex + 1)); // Changed from semestersToShow to 1
  };
  
  const visibleSemesters = filteredSemesters.slice(currentIndex, currentIndex + semestersToShow);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + semestersToShow < filteredSemesters.length;

  const handleOpenModal = (semesterLabel: string) => {
    setSelectedSemester(semesterLabel);
    setIsModalOpen(true);
  };

  const handleSaveCourses = (courses: any[]) => {
    if (selectedSemester && onCoursesUpdate) {
      onCoursesUpdate(selectedSemester, courses);
      
      // If this is a summer semester and has courses, mark it as having classes
      if (selectedSemester.includes('Summer') && courses.length > 0) {
        setSummersWithClasses(prev => new Set([...prev, selectedSemester]));
      }
      // If summer semester has no courses, remove from tracked summers
      else if (selectedSemester.includes('Summer') && courses.length === 0) {
        setSummersWithClasses(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedSemester);
          return newSet;
        });
      }
    }
    setIsModalOpen(false);
    setSelectedSemester(null);
  };

  const handleRemoveSummerSemester = (semesterLabel: string) => {
    setDismissedSummers(prev => new Set([...prev, semesterLabel]));
  };

  // Wrapped remove course handler to track summer changes
  const handleRemoveCourse = (semester: string, courseCode: string) => {
    if (onRemoveCourse) {
      onRemoveCourse(semester, courseCode);
      
      // If this is a summer semester, check if it still has courses after removal
      if (semester.includes('Summer')) {
        // Find the semester data after removal
        const semesterData = semesters.find(s => s.label === semester);
        if (semesterData && semesterData.courseCount <= 1) {
          // If this was the last course, remove from summers with classes
          setSummersWithClasses(prev => {
            const newSet = new Set(prev);
            newSet.delete(semester);
            return newSet;
          });
        }
      }
    }
  };

  // Handle summer semester toggle
  const handleSummerToggle = (checked: boolean) => {
    setIncludeSummerSemesters(checked);
    // Keep dismissed summers persistent - don't clear them
  };

  // Convert semester label to code (e.g., "Spring 2026" -> "202520")
  const getSemesterCode = (semesterLabel: string): string => {
    const parts = semesterLabel.split(' ');
    if (parts.length !== 2) return '';
    
    const season = parts[0];
    const year = parseInt(parts[1]);
    
    if (season === 'Fall') {
      return `${year}10`;
    } else if (season === 'Spring') {
      return `${year - 1}20`;
    } else if (season === 'Summer') {
      return `${year - 1}30`;
    }
    return '';
  };

  const handlePlanCourses = async (semesterLabel: string) => {
    const providerId = session?.user?.githubId || session?.user?.googleId;
    
    if (!providerId) {
      // If not logged in, just navigate to scheduler
      router.push('/scheduler');
      return;
    }

    setIsCreatingSchedule(true);
    const semesterCode = getSemesterCode(semesterLabel);
    
    if (semesterCode) {
      try {
        // Create or get schedule for this semester
        const response = await fetchWithAuth(`/api/users/${providerId}/schedule/${semesterCode}`);
        
        if (response.ok) {
          // Update the schedule context to this semester
          await setCurrentSemester(semesterCode);
          
          // Navigate to scheduler (which will now show the selected semester)
          router.push('/scheduler');
        } else {
          console.error('Failed to create schedule for semester');
          // Still navigate even if schedule creation fails
          router.push('/scheduler');
        }
      } catch (error) {
        console.error('Error creating schedule:', error);
        // Still navigate even on error
        router.push('/scheduler');
      }
    } else {
      // Fallback to just navigating
      router.push('/scheduler');
    }
    
    setIsCreatingSchedule(false);
  };

  return (
    <div>
      {/* Cards grid - full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300 ease-in-out">
        {visibleSemesters.map((semester, index) => (
          <div
            key={index}
            className={`relative p-6 rounded-lg border transition-all min-h-[350px] flex flex-col ${getStatusColor(semester.status)}`}
          >

            <div className="flex items-start justify-between mb-2">
              {getStatusIcon(semester.status)}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {getStatusLabel(semester.status)}
                </span>
                {/* X button for generated summer semesters only when they have no courses */}
                {semester.label.includes('Summer') && 
                 (semester as any).isGenerated && 
                 semester.courseCount === 0 && 
                 includeSummerSemesters && (
                  <button
                    onClick={() => handleRemoveSummerSemester(semester.label)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    title="Remove this summer semester"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">{semester.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {semester.courseCount > 0 ? (
                      <>
                        {semester.courseCount} {semester.courseCount === 1 ? "course" : "courses"} • {semester.credits} credits
                      </>
                    ) : (
                      "No courses yet"
                    )}
                  </p>
                </div>
                {/* X button for empty summer semesters only */}
                {semester.label.includes('Summer') && semester.courseCount === 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                    onClick={() => handleRemoveSummerSemester(semester.label)}
                    title="Dismiss this summer semester"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Course list at the top */}
            {semester.courses && semester.courses.length > 0 && (
              <div className="space-y-2 mb-4">
                {semester.courses.map((course: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{course.code}</span>
                      <span className="ml-2">{course.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            {/* Course list and actions */}
            <div className="mt-6 space-y-2">
              
              {/* Action buttons */}
              {semester.status === "completed" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOpenModal(semester.label)}
                >
                  {semester.courseCount > 0 ? "Edit Courses" : "Add Courses"}
                </Button>
              )}
              {semester.status === "current" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/scheduler')}
                >
                  View Schedule
                </Button>
              )}
              {semester.status === "upcoming" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handlePlanCourses(semester.label)}
                  disabled={isCreatingSchedule}
                >
                  {isCreatingSchedule ? "Creating Schedule..." : "Plan Courses"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation controls and summer checkbox below cards */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-summers"
            checked={includeSummerSemesters}
            onCheckedChange={handleSummerToggle}
          />
          <Label htmlFor="include-summers" className="text-sm">
            Include Summer Semesters
          </Label>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={!canGoNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Courses Modal */}
      {isModalOpen && selectedSemester && (
        <AddCoursesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          semester={selectedSemester}
          onSave={handleSaveCourses}
          existingCourses={semesters.find(s => s.label === selectedSemester)?.courses || []}
        />
      )}
    </div>
  );
}