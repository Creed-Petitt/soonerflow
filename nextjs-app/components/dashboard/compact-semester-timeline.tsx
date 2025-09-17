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
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const semestersToShow = 3;
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  useEffect(() => {
    if (semesters.length > 0) {
      let targetIdx = semesters.findIndex(sem => sem.status === "current");
      if (targetIdx === -1) {
        targetIdx = semesters.findIndex(sem => sem.status === "upcoming");
      }
      if (targetIdx !== -1) {
        const centerIndex = Math.max(0, targetIdx - 1);
        const finalIndex = Math.min(centerIndex, Math.max(0, semesters.length - 3));
        setCurrentIndex(finalIndex);
      }
    }
  }, [semesters]);

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

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(semesters.length - semestersToShow, currentIndex + 1));
  };
  
  const visibleSemesters = semesters.slice(currentIndex, currentIndex + semestersToShow);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + semestersToShow < semesters.length;

  const handleOpenModal = (semesterLabel: string) => {
    setSelectedSemester(semesterLabel);
    setIsModalOpen(true);
  };

  const handleSaveCourses = (courses: any[]) => {
    if (selectedSemester && onCoursesUpdate) {
      onCoursesUpdate(selectedSemester, courses);
    }
    setIsModalOpen(false);
    setSelectedSemester(null);
  };

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
      router.push('/scheduler');
      return;
    }

    setIsCreatingSchedule(true);
    const semesterCode = getSemesterCode(semesterLabel);
    
    if (semesterCode) {
      try {
        const response = await fetchWithAuth(`/api/users/${providerId}/schedule/${semesterCode}`);
        
        if (response.ok) {
          await setCurrentSemester(semesterCode);
          router.push('/scheduler');
        } else {
          router.push('/scheduler');
        }
      } catch (error) {
        router.push('/scheduler');
      }
    } else {
      router.push('/scheduler');
    }
    
    setIsCreatingSchedule(false);
  };

  return (
    <div>
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
              </div>
            </div>

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

            <div className="flex-1" />

            <div className="mt-6 space-y-2">
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

      <div className="flex items-center gap-4 mt-2">
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

      {isModalOpen && selectedSemester && (
        <AddCoursesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          semester={selectedSemester}
          onSave={handleSaveCourses}
          existingCourses={(semesters.find(s => s.label === selectedSemester)?.courses || []) as any}
        />
      )}
    </div>
  );
}