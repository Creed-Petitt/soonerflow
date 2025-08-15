import { ProgressRadialChart } from "@/components/progress-radial-chart";
import { GraduationCap } from "lucide-react";

interface AcademicOverviewCardProps {
  gpa: number | null;
  creditsCompleted: number;
  totalCredits: number;
  majorName?: string | null;
  graduationYear?: number | null;
  standing?: "good" | "warning" | "probation";
}

export function AcademicOverviewCard({ 
  gpa, 
  creditsCompleted, 
  totalCredits, 
  majorName,
  graduationYear,
  standing = "good" 
}: AcademicOverviewCardProps) {

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header with Major and Year */}
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="h-5 w-5 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {majorName || "Undeclared Major"} • Class of {graduationYear || "TBD"}
        </div>
      </div>

      {/* Chart and Stats Layout */}
      <div className="flex items-center gap-8">
        {/* Progress Chart */}
        <div className="flex-shrink-0 w-64 h-64">
          <ProgressRadialChart 
            creditsCompleted={creditsCompleted}
            totalCredits={totalCredits}
          />
        </div>
        
        {/* GPA Display */}
        <div className="flex-1 flex flex-col items-start gap-4">
          <div>
            <div className="text-3xl font-bold mb-1">
              GPA: {gpa !== null ? gpa.toFixed(1) : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">
              Current cumulative GPA
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Credits completed:</span>
              <span className="font-medium">{creditsCompleted}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Credits remaining:</span>
              <span className="font-medium">{totalCredits - creditsCompleted}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{Math.round((creditsCompleted / totalCredits) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}