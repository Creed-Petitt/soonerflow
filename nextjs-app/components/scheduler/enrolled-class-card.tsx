"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { ClassData, ScheduledClass } from "@/types/course"

interface EnhancedScheduledClass extends ScheduledClass {
  colorBg: string
  colorHex: string
}

interface EnrolledClassCardProps {
  classData: EnhancedScheduledClass
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
  availableSections,
  availableLabSections,
  showRemoveButton = true,
  onClick,
  isCurrentSemester = true
}: EnrolledClassCardProps) {
  const isCompleted = (classData.instructor === 'Completed' || classData.type === 'Completed Course') && !isCurrentSemester
  const isDemo = classData.id?.startsWith('demo-')

  return (
    <Card
      className={`p-2 relative group hover:shadow-md transition-shadow cursor-pointer ${isDemo ? 'opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${classData.colorBg} rounded-l`} />

      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{classData.subject} {classData.number || classData.courseNumber}</span>
              {isCompleted && <span className="text-xs text-green-600">✓</span>}
              {isDemo && (
                <span className="text-[10px] px-1 py-0.5 bg-muted rounded text-muted-foreground font-normal">
                  DEMO
                </span>
              )}
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