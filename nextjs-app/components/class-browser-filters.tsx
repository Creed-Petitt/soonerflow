"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  departments: Department[];
  userMajorDepts: string[];
  totalClassCount: number;
  groupedClassesLength: number;
  isSearching: boolean;
  performServerSearch: (query: string) => void;
}

export function ClassBrowserFilters({
  searchTerm,
  setSearchTerm,
  selectedDepartment,
  setSelectedDepartment,
  selectedLevel,
  setSelectedLevel,
  departments,
  userMajorDepts,
  totalClassCount,
  groupedClassesLength,
  isSearching,
  performServerSearch,
}: ClassBrowserFiltersProps) {
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      performServerSearch(value);
    }, 300);
    setSearchDebounceTimer(timer);
  };

  return (
    <>
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search all classes..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

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
          {searchTerm ? (
            <span>Found {totalClassCount} classes matching "{searchTerm}"</span>
          ) : (
            <span>Showing {groupedClassesLength} of {totalClassCount} unique courses</span>
          )}
          {isSearching && <span className="ml-2">(Searching...)</span>}
        </div>
      )}
    </>
  );
}