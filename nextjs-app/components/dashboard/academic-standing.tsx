import { ProgressRadialChart } from "@/components/progress-radial-chart";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface AcademicStandingProps {
  gpa: number | null;
  creditsCompleted: number;
  totalCredits: number;
  standing?: "good" | "warning" | "probation";
}

export function AcademicStanding({ 
  gpa, 
  creditsCompleted, 
  totalCredits, 
  standing = "good" 
}: AcademicStandingProps) {
  const progressPercentage = (creditsCompleted / totalCredits) * 100;
  const creditsRemaining = totalCredits - creditsCompleted;

  const getStandingColor = () => {
    switch (standing) {
      case "warning": return "text-yellow-600 dark:text-yellow-500";
      case "probation": return "text-red-600 dark:text-red-500";
      default: return "text-green-600 dark:text-green-500";
    }
  };

  const getStandingIcon = () => {
    switch (standing) {
      case "warning": 
      case "probation": 
        return <AlertTriangle className="h-4 w-4" />;
      default: 
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getStandingText = () => {
    switch (standing) {
      case "warning": return "Academic Warning";
      case "probation": return "Academic Probation";
      default: return "Good Standing";
    }
  };

  return (
    <div className="flex items-center gap-8 mt-8">
      {/* Large Radial Chart - Much Bigger */}
      <div className="flex-shrink-0 w-80 h-80">
        <ProgressRadialChart 
          creditsCompleted={creditsCompleted}
          totalCredits={totalCredits}
        />
      </div>
      
      {/* Simple GPA Display - Aligned with chart center */}
      <div className="flex-1 flex items-center">
        <div className="text-4xl font-bold">
          GPA: {gpa !== null ? gpa.toFixed(1) : "N/A"}
        </div>
      </div>
    </div>
  );
}