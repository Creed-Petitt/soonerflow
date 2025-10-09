"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassDetailDialog } from "./class-detail-dialog";
import { ClassBrowserFilters } from "./class-browser-filters";
import { ClassBrowserTable } from "./class-browser-table";
import { useSchedule } from "@/hooks/use-schedule";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { useClassData, type GroupedClass } from "@/hooks/useClassData";

interface ClassBrowserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userMajor?: string;
}

export function ClassBrowserPanel({ isOpen, onClose, userMajor }: ClassBrowserPanelProps) {
  const { scheduledClasses, addClass, isClassScheduled, currentSemester } = useSchedule();

  // State for filters and search
  const [selectedDepartment, setSelectedDepartment] = useState("C S");
  const [selectedLevel, setSelectedLevel] = useState("all");

  // Dialog state
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Custom hooks for data management
  const {
    departments,
    isLoading: departmentsLoading,
    loadDepartments,
  } = useDepartments();

  const {
    groupedClasses,
    isLoading: classDataLoading,
    loadClassesForDepartment,
    clearClasses,
  } = useClassData();

  // Combined loading state
  const isLoading = departmentsLoading || classDataLoading;

  // Load departments when panel opens or semester changes
  useEffect(() => {
    if (isOpen) {
      loadDepartments(currentSemester);
    }
  }, [isOpen, currentSemester]);

  // Load classes when department changes
  useEffect(() => {
    if (!selectedDepartment) return;
    loadClassesForDepartment(selectedDepartment, currentSemester);
  }, [selectedDepartment, currentSemester]); // Remove loadClassesForDepartment from deps

  // Filter classes by level
  let filteredGroupedClasses = [...groupedClasses];
  if (selectedLevel && selectedLevel !== "all") {
    filteredGroupedClasses = filteredGroupedClasses.filter(g => {
      const courseNum = parseInt(g.number);
      if (isNaN(courseNum)) return false;

      if (selectedLevel === "5000") {
        return courseNum >= 5000;
      } else {
        const levelStart = parseInt(selectedLevel);
        return courseNum >= levelStart && courseNum < levelStart + 1000;
      }
    });
  }

  const handleClassClick = (groupedClass: GroupedClass) => {
    setSelectedClass(groupedClass);
    setIsDialogOpen(true);
  };


  const handleAddToSchedule = async (section: any, labSection?: any) => {
    // Add the class directly - no validation needed after auth removal
    addClassToSchedule(section, labSection);
  };

  const addClassToSchedule = (section: any, labSection?: any) => {
    // Format the class data for the schedule
    const classData = {
      id: section.id,
      subject: section.subject,
      number: section.number || section.courseNumber,
      courseNumber: section.courseNumber || section.number,
      title: section.title,
      instructor: section.instructor || "TBA",
      time: section.meetingTimes?.[0] ?
        `${section.meetingTimes[0].days || ''} ${section.meetingTimes[0].startTime || ''}-${section.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
        : section.time || "TBA",
      location: section.meetingTimes?.[0]?.location || section.location || "TBA",
      credits: section.credits || 3,
      type: section.type,
      color: "#3b82f6",
      available_seats: section.available_seats ?? section.availableSeats,
      total_seats: section.total_seats ?? section.totalSeats,
    };

    addClass(classData);

    // If there's a lab, add it too
    if (labSection) {
      const labData = {
        id: labSection.id,
        subject: labSection.subject,
        number: labSection.number || labSection.courseNumber,
        courseNumber: labSection.courseNumber || labSection.number,
        title: `Lab - ${section.title}`,
        instructor: labSection.instructor || "TBA",
        time: labSection.meetingTimes?.[0] ?
          `${labSection.meetingTimes[0].days || ''} ${labSection.meetingTimes[0].startTime || ''}-${labSection.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
          : labSection.time || "TBA",
        location: labSection.meetingTimes?.[0]?.location || labSection.location || "TBA",
        credits: 0,
        type: "Lab",
        color: "#10b981", // Green for labs
        available_seats: labSection.available_seats ?? labSection.availableSeats,
        total_seats: labSection.total_seats ?? labSection.totalSeats,
      };
      addClass(labData);
    }

    toast.success(`Added ${section.subject} ${section.number || section.courseNumber} to schedule`);
    setIsDialogOpen(false);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 h-full w-[600px] bg-background border-r shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Browse Classes</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ClassBrowserFilters
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          departments={departments}
          groupedClassesLength={groupedClasses.length}
        />

        <ClassBrowserTable
          filteredGroupedClasses={filteredGroupedClasses}
          isLoading={isLoading}
          selectedDepartment={selectedDepartment}
          groupedClassesLength={groupedClasses.length}
          handleClassClick={handleClassClick}
          isClassScheduled={isClassScheduled}
          scheduledClasses={scheduledClasses}
        />
      </div>

      {selectedClass && (
        <ClassDetailDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          groupedClass={selectedClass}
          onAddToSchedule={handleAddToSchedule}
        />
      )}
    </>
  );
}