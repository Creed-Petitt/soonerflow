import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle2, Clock, Calendar, GraduationCap } from "lucide-react";
import Link from "next/link";

interface SemesterData {
  label: string;
  status: "completed" | "current" | "upcoming" | "future";
  credits: number;
  courseCount: number;
}

interface CompactSemesterTimelineProps {
  semesters: SemesterData[];
  onViewAll?: () => void;
}

export function CompactSemesterTimeline({ semesters, onViewAll }: CompactSemesterTimelineProps) {
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

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Academic Timeline</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semesters.slice(0, 3).map((semester, index) => (
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

            <div className="space-y-2">
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

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Course list placeholder area */}
            <div className="mt-6 space-y-2">
              {semester.status === "completed" && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Completed courses will appear here</p>
                </div>
              )}
              {semester.status === "current" && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Current courses will appear here</p>
                </div>
              )}
              {semester.status === "upcoming" && (
                <Link href="/scheduler">
                  <Button size="sm" variant="outline" className="w-full">
                    Plan Courses
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}