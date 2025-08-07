"use client"

import * as React from "react"
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverCloseButton,
} from "@/components/prismui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BookOpen,
  Clock,
  Users,
  MapPin,
  Star,
  GraduationCap,
  AlertCircle,
  Plus,
  CheckCircle2
} from "lucide-react"

interface ClassData {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  time: string
  location: string
  credits?: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
  available_seats?: number
  total_seats?: number
  type?: string
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
  labSections?: ClassData[]
}

interface ClassDetailsPopoverProps {
  groupedClass: GroupedClass
  onAddToSchedule: (classData: ClassData) => void
  scheduledClasses: ClassData[]
  children: React.ReactNode
}

// Mock data - same as before
const getMockCourseDescription = (subject: string, number: string) => {
  const descriptions: Record<string, string> = {
    "ECE-2214": "Number systems, Boolean algebra, minimization procedures, combinational logic functions, introduction to sequential logic design, finite state machines and clocked (synchronous) sequential circuits.",
    "ECE-2523": "Covers the role of statistics in electrical and computer engineering and includes substantial exposure to applications appropriate to the discipline: basic probability, random variables, vectors and processes.",
    "CS-2334": "Object-oriented programming concepts, program design, and data structures. Inheritance, polymorphism, and generic programming.",
    "MATH-2443": "Differentiation and integration of functions of several variables. Multiple integrals, line integrals, surface integrals."
  }
  
  const key = `${subject}-${number}`
  return descriptions[key] || `Detailed course content for ${subject} ${number}. Topics include core concepts, practical applications, and hands-on learning experiences.`
}

const getMockPrerequisites = (subject: string, number: string): string[] => {
  const prerequisites: Record<string, string[]> = {
    "ECE-2214": ["MATH 1823", "MATH 1914"],
    "ECE-2523": ["ECE major", "MATH 2433"],
    "CS-2334": ["CS 1323", "MATH 2924"],
    "MATH-2443": ["MATH 1914", "MATH 2924"]
  }
  
  const key = `${subject}-${number}`
  return prerequisites[key] || []
}

const getMockRequiredByMajors = (subject: string, number: string): string[] => {
  const majors: Record<string, string[]> = {
    "ECE-2214": ["Computer Engineering", "Electrical Engineering"],
    "ECE-2523": ["Electrical Engineering"],
    "CS-2334": ["Computer Science", "Computer Engineering"],
    "MATH-2443": ["Mathematics", "Computer Science"]
  }
  
  const key = `${subject}-${number}`
  return majors[key] || []
}

export function ClassDetailsPopover({
  groupedClass,
  onAddToSchedule,
  scheduledClasses,
  children
}: ClassDetailsPopoverProps) {
  const description = getMockCourseDescription(groupedClass.subject, groupedClass.number)
  const prerequisites = getMockPrerequisites(groupedClass.subject, groupedClass.number)
  const requiredByMajors = getMockRequiredByMajors(groupedClass.subject, groupedClass.number)
  
  const primarySection = groupedClass.sections[0]
  const availableSeats = primarySection.available_seats || 0
  const totalSeats = primarySection.total_seats || 1
  const seatProgress = Math.round((availableSeats / totalSeats) * 100)

  const handleAddSection = (section: ClassData) => {
    onAddToSchedule(section)
  }

  return (
    <PopoverRoot>
      <PopoverTrigger variant="outline">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[450px]">
        <PopoverHeader>
          <div className="space-y-1">
            <Badge
              variant="secondary"
              className={
                seatProgress > 50
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
              }
            >
              {seatProgress > 50 ? "Available" : "Limited Seats"}
            </Badge>
            <h3 className="text-lg font-semibold">
              {groupedClass.subject} {groupedClass.number}: {groupedClass.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {groupedClass.credits} Credit Hours
            </p>
          </div>
        </PopoverHeader>
        
        <PopoverBody>
          {/* Seat Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Seat Availability</span>
              <span>{availableSeats}/{totalSeats} seats</span>
            </div>
            <Progress value={seatProgress} className="h-2" />
          </div>

          {/* Course Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" />
              <h4 className="text-sm font-medium">Course Description</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <h4 className="text-sm font-medium">Prerequisites</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {prerequisites.map((prereq, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Required by Majors */}
          {requiredByMajors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4" />
                <h4 className="text-sm font-medium">Required by Majors</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {requiredByMajors.map((major, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {major}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Sections */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <h4 className="text-sm font-medium">Available Sections</h4>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {groupedClass.sections.map((section) => {
                const sectionScheduled = scheduledClasses.some(s => s.id === section.id)
                return (
                  <div key={section.id} className={`flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm ${sectionScheduled ? "opacity-60" : ""}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{section.time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {section.instructor} • {section.available_seats || 0}/{section.total_seats || 0} seats
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddSection(section)}
                      disabled={sectionScheduled}
                      size="sm"
                      variant="outline"
                    >
                      {sectionScheduled ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </PopoverBody>
        
        <PopoverFooter>
          <PopoverCloseButton />
          <Button size="sm" onClick={() => handleAddSection(primarySection)}>
            Add Primary Section
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </PopoverRoot>
  )
}