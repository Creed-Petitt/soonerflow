"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/course";

interface CourseListItemProps {
  course: Course;
  isSelected: boolean;
  isCompleted: boolean;
  onToggle: (course: Course) => void;
  className?: string;
}

export function CourseListItem({
  course,
  isSelected,
  isCompleted,
  onToggle,
  className = ""
}: CourseListItemProps) {
  const handleClick = () => {
    if (!isCompleted) {
      onToggle(course);
    }
  };

  return (
    <div
      className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
        isCompleted
          ? 'opacity-50 bg-muted cursor-not-allowed'
          : 'hover:bg-accent cursor-pointer'
      } ${className}`}
      onClick={handleClick}
    >
      <Checkbox
        checked={isSelected}
        disabled={isCompleted}
        onCheckedChange={() => onToggle(course)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className={`font-semibold text-base ${isCompleted ? 'line-through' : ''}`}>
            {course.code}
          </span>
          <span className={`text-sm text-muted-foreground truncate ${isCompleted ? 'line-through' : ''}`}>
            {course.name}
          </span>
          {isCompleted && (
            <Badge variant="outline" className="text-xs">
              Already Completed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{course.credits} credits</Badge>
          {course.category && (
            <Badge variant="outline">{course.category}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}