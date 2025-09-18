import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, BookOpen, Calendar, Award } from "lucide-react"

interface StudentProfileCardProps {
  userName?: string | null
  majorName?: string | null
  graduationYear?: number | null
  gpa?: number | null
  creditsCompleted: number
  totalCredits: number
  academicStanding?: "good" | "warning" | "probation"
}

export function StudentProfileCard({
  userName,
  majorName,
  graduationYear,
  gpa,
  creditsCompleted,
  totalCredits,
  academicStanding = "good"
}: StudentProfileCardProps) {
  const fullName = userName || 'Student'
  const creditProgress = (creditsCompleted / totalCredits) * 100
  
  const getGPAColor = () => {
    if (gpa === null) return "text-muted-foreground"
    if (gpa >= 3.5) return "text-green-600 dark:text-green-500"
    if (gpa >= 2.5) return "text-blue-600 dark:text-blue-500"
    if (gpa >= 2.0) return "text-yellow-600 dark:text-yellow-500"
    return "text-red-600 dark:text-red-500"
  }
  
  const getStandingIndicator = () => {
    if (academicStanding === "warning") {
      return (
        <div className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500">
          <Award className="h-3 w-3" />
          <span>Academic Warning</span>
        </div>
      )
    }
    if (academicStanding === "probation") {
      return (
        <div className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-500">
          <Award className="h-3 w-3" />
          <span>Academic Probation</span>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden bg-transparent">
      <CardContent className="px-6" style={{ paddingTop: '3px', paddingBottom: '3px' }}>
        <div className="pb-3 mb-3 border-b border-border/30">
          <h2 className="text-2xl font-semibold tracking-tight mb-1">
            {majorName || "Undeclared"} • Class of {graduationYear || "TBD"}
          </h2>
        </div>
        <div className="py-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Credit Progress</span>
            </div>
            <span className="text-sm font-medium">
              {creditsCompleted} / {totalCredits}
            </span>
          </div>
          <Progress value={creditProgress} className="h-2 mb-1" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(creditProgress)}% Complete</span>
            <span>{totalCredits - creditsCompleted} credits remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}