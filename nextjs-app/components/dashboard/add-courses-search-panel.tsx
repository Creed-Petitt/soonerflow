"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { CourseListItem } from "./course-list-item";
import type { Course, Department } from "@/types/course";

interface AddCoursesSearchPanelProps {
  // Search state
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchLoading: boolean;

  // Department filter
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: Department[];
  departmentsLoading: boolean;

  // Course data
  displayedCourses: Course[];
  loading: boolean;
  isLoadingMore: boolean;
  totalCoursesCount: number;
  hasMoreCourses: boolean;

  // Course selection
  onCourseToggle: (course: Course) => void;
  isCourseSelected: (courseId: string) => boolean;
  isCourseCompleted: (courseId: string) => boolean;

  // Infinite scroll
  onLoadMore: () => void;
}

export function AddCoursesSearchPanel({
  searchQuery,
  onSearchChange,
  searchLoading,
  selectedDepartment,
  onDepartmentChange,
  departments,
  departmentsLoading,
  displayedCourses,
  loading,
  isLoadingMore,
  totalCoursesCount,
  hasMoreCourses,
  onCourseToggle,
  isCourseSelected,
  isCourseCompleted,
  onLoadMore
}: AddCoursesSearchPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return;

      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // Load more when within 100px of bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreCourses && !isLoadingMore) {
        onLoadMore();
      }
    };

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreCourses, isLoadingMore, onLoadMore]);

  const renderSearchInfo = () => {
    if (searchQuery.length >= 1) {
      return (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Showing {displayedCourses.length} results from all courses
          </p>
        </div>
      );
    }

    if (searchQuery.length === 0 && totalCoursesCount > 0) {
      return (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing {displayedCourses.length} of {totalCoursesCount} courses
            {hasMoreCourses && " (scroll down to load more)"}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderEmptyState = () => {
    if (loading || searchLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchLoading ? `Searching all courses for "${searchQuery}"...` : 'Loading courses...'}
          </p>
        </div>
      );
    }

    if (searchQuery.length >= 1 && displayedCourses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No courses found matching "{searchQuery}"</p>
        </div>
      );
    }

    if (displayedCourses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedDepartment ? 'No courses in this department' : 'Select a department or search for courses'}
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

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
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="space-y-2 pr-4">
            {renderEmptyState()}

            {displayedCourses.length > 0 && (
              <>
                {renderSearchInfo()}
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
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Loading more courses...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}