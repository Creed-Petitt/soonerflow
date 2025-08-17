"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSchedule } from "@/contexts/schedule-context"

export function SemesterPicker() {
  const { 
    currentSemester, 
    availableSemesters, 
    setCurrentSemester,
    loading 
  } = useSchedule()

  // Get the current semester details
  const currentSemesterDetails = availableSemesters.find(
    sem => sem.code === currentSemester
  )

  // Get the actual current semester code for filtering
  const getActualCurrentSemester = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    if (month >= 1 && month <= 5) {
      return `${year - 1}20`; // Spring
    } else if (month >= 8 && month <= 12) {
      return `${year}10`; // Fall
    } else {
      return `${year - 1}30`; // Summer
    }
  };

  const actualCurrentSemester = getActualCurrentSemester();
  
  // Filter to only show current and future semesters
  const filteredSemesters = availableSemesters.filter(
    sem => sem.code >= actualCurrentSemester
  );

  if (loading || filteredSemesters.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 px-3">
        <Calendar className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="font-medium">
            {currentSemesterDetails?.name || currentSemester}
          </span>
          {currentSemesterDetails?.is_summer && (
            <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
              Summer
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {filteredSemesters.map((semester) => (
          <DropdownMenuItem
            key={semester.code}
            onClick={() => setCurrentSemester(semester.code)}
            className={`flex items-center justify-between ${
              semester.code === currentSemester ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{semester.name}</span>
              {semester.is_summer && (
                <Badge variant="outline" className="px-1 py-0 text-xs">
                  Summer
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {semester.class_count.toLocaleString()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}