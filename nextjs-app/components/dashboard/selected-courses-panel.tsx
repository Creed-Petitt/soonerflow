"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { SelectedCourse } from "@/types/course";

interface SelectedCoursesPanelProps {
  semester: string;
  selectedCourses: SelectedCourse[];
  totalCredits: number;
  projectedGPA: string;
  selectedCount: number;
  onGradeChange: (courseId: string, grade: string) => void;
  onRemoveCourse: (courseId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function SelectedCoursesPanel({
  semester,
  selectedCourses,
  totalCredits,
  projectedGPA,
  selectedCount,
  onGradeChange,
  onRemoveCourse,
  onSave,
  onClose
}: SelectedCoursesPanelProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {semester} Courses ({selectedCount})
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-2">
            {selectedCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No courses selected yet. Choose courses from the left panel.
                </p>
              </div>
            ) : (
              selectedCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{course.code}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{course.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={course.grade}
                      onValueChange={(value) => onGradeChange(course.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A (4.0)</SelectItem>
                        <SelectItem value="B">B (3.0)</SelectItem>
                        <SelectItem value="C">C (2.0)</SelectItem>
                        <SelectItem value="D">D (1.0)</SelectItem>
                        <SelectItem value="F">F (0.0)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveCourse(course.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="border-t p-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Total Credits:</span>
              <span className="font-bold">{totalCredits}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Projected GPA:</span>
              <span className="font-bold">{projectedGPA}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" size="lg">
              Cancel
            </Button>
            <Button
              onClick={onSave}
              className="flex-1"
              size="lg"
              disabled={selectedCount === 0}
            >
              Mark as Complete ({selectedCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}