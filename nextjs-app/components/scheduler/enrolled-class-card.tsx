"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
  description?: string
  type?: string
  grade?: string
  semester?: string
}

interface ScheduledClass extends ClassData {
  colorBg: string
  colorHex: string
}

interface EnrolledClassCardProps {
  classData: ScheduledClass
  onRemove: () => void
  onSwitchSection?: (newSection: ClassData) => void
  availableSections?: ClassData[]
  availableLabSections?: ClassData[]
  showRemoveButton?: boolean
  onClick?: () => void
  isCurrentSemester?: boolean
}

export function EnrolledClassCard({
  classData,
  onRemove,
  onSwitchSection,
  availableSections,
  availableLabSections,
  showRemoveButton = true,
  onClick,
  isCurrentSemester = true
}: EnrolledClassCardProps) {
  const hasMultipleSections = (availableSections && availableSections.length > 1) ||
                              (classData.type === 'Lab with No Credit' && availableLabSections && availableLabSections.length > 1)

  const isCompleted = (classData.instructor === 'Completed' || classData.type === 'Completed Course') && !isCurrentSemester

  return (
    <Card
      className="p-2 relative group hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${classData.colorBg} rounded-l`} />

      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{classData.subject} {classData.number}</span>
              {isCompleted && <span className="text-xs text-green-600">✓</span>}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {classData.title}
            </p>
          </div>

          {showRemoveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}