"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CourseListItem } from "./course-list-item";
import type { Course, Department } from "@/types/course";

interface AddCoursesSearchPanelProps {
  // Department filter
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: Department[];
  departmentsLoading: boolean;

  // Course data
  displayedCourses: Course[];
  loading: boolean;
  totalCoursesCount: number;

  // Course selection
  onCourseToggle: (course: Course) => void;
  isCourseSelected: (courseId: string) => boolean;
  isCourseCompleted: (courseId: string) => boolean;
}

export function AddCoursesSearchPanel({
  selectedDepartment,
  onDepartmentChange,
  departments,
  departmentsLoading,
  displayedCourses,
  loading,
  totalCoursesCount,
  onCourseToggle,
  isCourseSelected,
  isCourseCompleted
}: AddCoursesSearchPanelProps) {

  const renderCourseInfo = () => {
    if (totalCoursesCount > 0) {
      return (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing {displayedCourses.length} of {totalCoursesCount} courses
          </p>
        </div>
      );
    }
    return null;
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      );
    }

    if (displayedCourses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedDepartment ? 'No courses in this department' : 'Select a department to view courses'}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 border-r grid grid-rows-[auto_1fr] h-full">
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold mb-4">Select Courses</h3>
        <div className="mb-4">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="major">My Major Requirements</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.code} value={dept.code}>
                  {dept.code} ({dept.count} classes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {renderEmptyState()}

            {displayedCourses.length > 0 && (
              <>
                {renderCourseInfo()}
                {displayedCourses.map((course, index) => (
                  <CourseListItem
                    key={course.id}
                    course={course}
                    isSelected={isCourseSelected(course.id)}
                    isCompleted={isCourseCompleted(course.id)}
                    onToggle={onCourseToggle}
                    className={index < displayedCourses.length - 1 ? 'mb-2' : ''}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}