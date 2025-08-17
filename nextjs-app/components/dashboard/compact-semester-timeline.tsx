import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, CheckCircle2, Clock, Calendar, GraduationCap, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AddCoursesModal } from "./add-courses-modal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSchedule } from "@/contexts/schedule-context";

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
}

interface CompactSemesterTimelineProps {
  semesters: SemesterData[];
  onViewAll?: () => void;
  onCoursesUpdate?: (semester: string, courses: any[]) => void;
  onRemoveCourse?: (semester: string, courseCode: string) => void;
}

export function CompactSemesterTimeline({ semesters, onViewAll, onCoursesUpdate, onRemoveCourse }: CompactSemesterTimelineProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setCurrentSemester } = useSchedule();
  
  // Find the current semester index and center it
  const findCurrentSemesterIndex = () => {
    const currentIdx = semesters.findIndex(sem => sem.status === "current");
    if (currentIdx === -1) return 0; // Fallback to 0 if no current semester
    
    // Center the current semester (show previous, current, next)
    const centerIndex = Math.max(0, currentIdx - 1);
    // Ensure we don't go past the end when centering
    return Math.min(centerIndex, Math.max(0, semesters.length - 3));
  };
  
  const [currentIndex, setCurrentIndex] = useState(findCurrentSemesterIndex());
  const semestersToShow = 3;
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  
  // Update the index when semesters data changes
  useEffect(() => {
    setCurrentIndex(findCurrentSemesterIndex());
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
        return "ring-2 ring-blue-500/30";
      case "upcoming":
        return "";
      case "future":
        return "";
    }
  };

  const getStatusLabel = (status: SemesterData["status"]) => {
    switch (status) {
      case "completed": return "Completed";
      case "current": return "In Progress";
      case "upcoming": return "Next Semester";
      case "future": return "Graduation Target";
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1)); // Changed from semestersToShow to 1
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(semesters.length - semestersToShow, currentIndex + 1)); // Changed from semestersToShow to 1
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
    if (!session?.user?.githubId) {
      // If not logged in, just navigate to scheduler
      router.push('/scheduler');
      return;
    }

    setIsCreatingSchedule(true);
    const semesterCode = getSemesterCode(semesterLabel);
    
    if (semesterCode) {
      try {
        // Create or get schedule for this semester
        const response = await fetch(`/api/users/${session.user.githubId}/schedule/${semesterCode}`);
        
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
      {/* Navigation buttons above cards */}
      <div className="flex justify-end gap-2 mb-4">
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
      
      {/* Cards grid - now full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300 ease-in-out">
        {visibleSemesters.map((semester, index) => (
          <div
            key={index}
            className={`relative p-6 rounded-lg border transition-all min-h-[350px] flex flex-col ${getStatusColor(semester.status)}`}
          >

            <div className="flex items-start justify-between mb-2">
              {getStatusIcon(semester.status)}
              <span className="text-xs text-muted-foreground">
                {getStatusLabel(semester.status)}
              </span>
            </div>

            <div className="mb-4">
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

            {/* Course list at the top */}
            {semester.courses && semester.courses.length > 0 && (
              <div className="space-y-2 mb-4">
                {semester.courses.map((course: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{course.code}</span>
                      <span className="ml-2">{course.grade}</span>
                    </div>
                    {onRemoveCourse && (
                      <button
                        onClick={() => onRemoveCourse(semester.label, course.code)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
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
                <div className="text-sm text-muted-foreground text-center">
                  <p>In Progress</p>
                </div>
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