import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface GPACardProps {
  gpa?: number | null
}

export function GPACard({ gpa }: GPACardProps) {
  const getGPAColor = () => {
    if (gpa === null) return "text-muted-foreground"
    if (gpa >= 3.5) return "text-green-600 dark:text-green-500"
    if (gpa >= 2.5) return "text-blue-600 dark:text-blue-500"
    if (gpa >= 2.0) return "text-yellow-600 dark:text-yellow-500"
    return "text-red-600 dark:text-red-500"
  }

  return (
    <Card className="overflow-hidden w-48 h-full bg-transparent">
      <CardContent className="flex items-center justify-center h-full px-4 pt-0 pb-4">
        <div className="text-center">
          <p className="text-2xl font-semibold tracking-tight mb-1">GPA</p>
          <p className={`text-5xl font-bold ${getGPAColor()}`}>
            {gpa !== null ? gpa.toFixed(2) : "N/A"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}