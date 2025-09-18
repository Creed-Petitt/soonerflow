"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  code: string;
  count: number;
}

interface ClassBrowserFiltersProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  departments: Department[];
  userMajorDepts: string[];
  totalClassCount: number;
  groupedClassesLength: number;
}

export function ClassBrowserFilters({
  selectedDepartment,
  setSelectedDepartment,
  selectedLevel,
  setSelectedLevel,
  departments,
  userMajorDepts,
  totalClassCount,
  groupedClassesLength,
}: ClassBrowserFiltersProps) {

  return (
    <>
      <div className="p-4 space-y-3 border-b">
        <div className="flex gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {userMajorDepts.length > 0 && (
                <SelectItem value="major">My Major</SelectItem>
              )}
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.code} value={dept.code}>
                  {dept.code} ({dept.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1000">1000 Level</SelectItem>
              <SelectItem value="2000">2000 Level</SelectItem>
              <SelectItem value="3000">3000 Level</SelectItem>
              <SelectItem value="4000">4000 Level</SelectItem>
              <SelectItem value="5000">5000+ Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalClassCount > 0 && (
        <div className="px-4 py-2 bg-muted/50 border-b text-sm">
          <span>Showing {groupedClassesLength} of {totalClassCount} unique courses</span>
        </div>
      )}
    </>
  );
}