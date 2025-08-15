import { Button } from "@/components/ui/button";
import { Clock, MapPin, CalendarDays, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Course {
  code: string;
  name?: string;
  time?: string;
  location?: string;
  instructor?: string;
  credits?: number;
}

interface CurrentSemesterWidgetProps {
  currentSemester: string;
  courses: Course[];
  nextClass?: {
    code: string;
    time: string;
    location: string;
    minutesUntil: number;
  } | null;
}

export function CurrentSemesterWidget({ 
  currentSemester, 
  courses, 
  nextClass 
}: CurrentSemesterWidgetProps) {
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 3), 0);
  
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-bold mb-1">{currentSemester}</h2>
        <p className="text-sm text-muted-foreground">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} • {totalCredits} credits
        </p>
      </div>

      {nextClass && (
        <div className="bg-blue-500/10 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Next Class in {nextClass.minutesUntil} minutes</p>
              <p className="text-xs text-muted-foreground">
                {nextClass.code} • {nextClass.time} • {nextClass.location}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {courses.length > 0 ? (
          <>
            {courses.map((course, index) => (
              <div key={index} className="py-2">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-sm">{course.code}</div>
                  <span className="text-xs text-muted-foreground font-medium">{course.credits || 3} cr</span>
                </div>
                {course.name && (
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.name}</div>
                )}
                <div className="space-y-1">
                  {course.time && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{course.time}</span>
                    </div>
                  )}
                  {course.location && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  {course.instructor && (
                    <div className="text-xs text-muted-foreground">
                      {course.instructor}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-4">
              <Link href="/scheduler">
                <Button variant="outline" className="w-full">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  View Full Schedule
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No courses enrolled for this semester</p>
            <Link href="/scheduler">
              <Button className="w-full">
                <CalendarDays className="h-4 w-4 mr-2" />
                Plan Your Schedule
              </Button>
            </Link>
          </div>
        )}
      </div>

      {courses.length > 6 && (
        <div className="mt-3 pt-3 border-t">
          <Link href="/scheduler">
            <Button variant="ghost" size="sm" className="w-full">
              View all {courses.length} courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}