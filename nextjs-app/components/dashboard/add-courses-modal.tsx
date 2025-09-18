"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddCoursesSearchPanel } from "./add-courses-search-panel";
import { SelectedCoursesPanel } from "./selected-courses-panel";
import { useAddCoursesData } from "@/hooks/useAddCoursesData";
import { useSelectedCourses } from "@/hooks/useSelectedCourses";
import type { SelectedCourse } from "@/types/course";

interface AddCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  semester: string;
  onSave: (courses: SelectedCourse[]) => void;
  existingCourses?: SelectedCourse[];
}

export function AddCoursesModal({
  isOpen,
  onClose,
  semester,
  onSave,
  existingCourses = []
}: AddCoursesModalProps) {
  // Custom hooks for data management
  const coursesData = useAddCoursesData({ semester, isOpen });
  const selectedCoursesData = useSelectedCourses({
    isOpen,
    existingCourses,
    onSave: (courses) => {
      onSave(courses);
      onClose();
    }
  });

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      coursesData.loadUserMajor();
    } else {
      coursesData.resetData();
    }
  }, [isOpen, coursesData]);

  // Set default to major when user major is loaded
  useEffect(() => {
    if (coursesData.userMajor && coursesData.departments.length > 0 && !coursesData.selectedDepartment) {
      coursesData.setSelectedDepartment("major");
    }
  }, [coursesData.userMajor, coursesData.departments.length, coursesData.selectedDepartment, coursesData]);

  // Handle department changes
  useEffect(() => {
    if (coursesData.selectedDepartment === "major") {
      coursesData.loadMajorCourses();
    } else if (coursesData.selectedDepartment && coursesData.selectedDepartment !== "all") {
      coursesData.loadClassesForDepartment(coursesData.selectedDepartment);
    }
  }, [coursesData.selectedDepartment, coursesData.userMajor, coursesData]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[70vw] !w-[70vw] !h-[90vh] p-0 !max-h-[90vh]"
        style={{
          maxWidth: '70vw',
          width: '70vw',
          height: '90vh',
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add Courses to {semester}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full overflow-hidden">

          <SelectedCoursesPanel
            semester={semester}
            selectedCourses={selectedCoursesData.selectedCourses}
            totalCredits={selectedCoursesData.totalCredits}
            projectedGPA={selectedCoursesData.projectedGPA}
            selectedCount={selectedCoursesData.selectedCount}
            onGradeChange={selectedCoursesData.handleGradeChange}
            onRemoveCourse={selectedCoursesData.handleRemoveCourse}
            onSave={selectedCoursesData.handleSave}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}