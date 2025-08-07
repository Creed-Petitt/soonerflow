"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
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
import { Star, Users, Calendar, BookOpen, User, Clock } from "lucide-react"
import { useExpandable } from "@/hooks/use-expandable"
import { ClassDetailsPopover } from "@/components/class-details-popover"
import { ProfessorDetailsPopover } from "@/components/professor-details-popover"

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

interface PrismaClassCardProps {
  groupedClass: GroupedClass
  onAddToSchedule: (classData: ClassData) => void
  scheduledClasses: ClassData[]
}

export function PrismaClassCard({ 
  groupedClass, 
  onAddToSchedule, 
  scheduledClasses
}: PrismaClassCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable()
  
  // Get the primary section to display
  const primarySection = groupedClass.sections[0]
  
  // Check if any section is scheduled
  const isAnyScheduled = scheduledClasses.some(
    scheduled => 
      scheduled.subject === groupedClass.subject && 
      scheduled.number === groupedClass.number
  )

  // Calculate seat availability percentage
  const availableSeats = primarySection.available_seats || 0
  const totalSeats = primarySection.total_seats || 1
  const seatProgress = Math.round((availableSeats / totalSeats) * 100)

  // Format time for compact display
  const formatCompactTime = (timeString: string) => {
    if (!timeString || timeString === 'TBA') return 'TBA'
    const parts = timeString.split(' ')
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`
    }
    return timeString
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (groupedClass.labSections && groupedClass.labSections.length > 0) {
      onAddToSchedule(primarySection)
    } else {
      onAddToSchedule(primarySection)
    }
  }

  return (
    <Card 
      className={`w-full max-w-xs cursor-pointer transition-all duration-300 hover:shadow-sm mb-1 ${
        isAnyScheduled ? 'opacity-60' : ''
      }`}
      onClick={toggleExpand}
    >
      {/* Collapsed View - Super Compact */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={`text-xs px-1.5 py-0.5 ${
                  seatProgress > 50
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {seatProgress > 50 ? "Available" : "Limited"}
              </Badge>
            </div>
            <h3 className="font-semibold text-base">
              {groupedClass.subject} {groupedClass.number}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatCompactTime(primarySection.time)}
            </p>
          </div>
          <Button 
            onClick={handleAddClick}
            disabled={isAnyScheduled}
            size="sm"
            className="h-7 w-7 p-0 text-xs"
          >
            +
          </Button>
        </div>
      </div>

      {/* Expanded View - More Details */}
      <motion.div
        style={{ height: animatedHeight }}
        animate={{ height: isExpanded ? "auto" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="overflow-hidden"
      >
        {isExpanded && (
          <div className="px-2 pb-2 space-y-2 border-t">
            <div className="pt-2">
              {/* Course Title - Compact */}
              <div className="mb-2">
                <h4 className="font-semibold text-sm">
                  {groupedClass.subject} {groupedClass.number} - {groupedClass.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{groupedClass.credits} Credits</span>
                  <span>{availableSeats}/{totalSeats} seats</span>
                  <span>{primarySection.instructor}</span>
                  {primarySection.rating && primarySection.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{primarySection.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seat Progress - Compact */}
              <div className="mb-2">
                <Progress value={seatProgress} className="h-1.5" />
              </div>

              {/* Action Buttons - Only 2 buttons that fit */}
              <div className="flex gap-1">
                <ClassDetailsPopover
                  groupedClass={groupedClass}
                  onAddToSchedule={onAddToSchedule}
                  scheduledClasses={scheduledClasses}
                >
                  <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                    📖 Course Info
                  </Button>
                </ClassDetailsPopover>

                <ProfessorDetailsPopover
                  instructor={primarySection.instructor}
                  classData={primarySection}
                >
                  <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                    👨‍🏫 Professor
                  </Button>
                </ProfessorDetailsPopover>

                <div className="flex-1" />
                <Button 
                  onClick={handleAddClick}
                  disabled={isAnyScheduled}
                  size="sm"
                  className="text-xs h-7 px-3"
                >
                  {isAnyScheduled ? 'Added' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Card>
  )
}