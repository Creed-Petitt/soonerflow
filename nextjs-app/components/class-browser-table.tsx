"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GroupedClass } from "@/hooks/useClassData";
import { hasTimeConflict } from "@/lib/time-conflict-utils";
import type { ScheduledClass } from "@/types/course";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassBrowserTableProps {
  filteredGroupedClasses: GroupedClass[];
  isLoading: boolean;
  handleClassClick: (grouped: GroupedClass) => void;
  isClassScheduled: (id: string) => boolean;
  scheduledClasses: ScheduledClass[];
}

// Helper function to get display info for a grouped class
function getGroupedClassDisplay(grouped: GroupedClass) {
  // Ensure we have sections
  if (!grouped.sections || grouped.sections.length === 0) {
    return {
      displaySection: null,
      totalAvailable: 0,
      totalSeats: 0,
      sectionCount: 0,
      labCount: grouped.labSections?.length || 0
    };
  }

  // Find first section with available seats for display
  const availableSection = grouped.sections.find(s =>
    s.available_seats === undefined || s.available_seats > 0
  ) || grouped.sections[0];

  // Count total available seats across all sections
  const totalAvailable = grouped.sections.reduce((sum, s) =>
    sum + (s.available_seats || 0), 0
  );
  const totalSeats = grouped.sections.reduce((sum, s) =>
    sum + (s.total_seats || 0), 0
  );

  return {
    displaySection: availableSection,
    totalAvailable,
    totalSeats,
    sectionCount: grouped.sections.length,
    labCount: grouped.labSections?.length || 0
  };
}

export function ClassBrowserTable({
  filteredGroupedClasses,
  isLoading,
  handleClassClick,
  isClassScheduled,
  scheduledClasses,
}: ClassBrowserTableProps) {

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
      <div>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[120px]">Course</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[80px]">Credits</TableHead>
            <TableHead className="w-[80px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : filteredGroupedClasses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No classes found
              </TableCell>
            </TableRow>
          ) : (
            filteredGroupedClasses.map((grouped: GroupedClass) => {
              const display = getGroupedClassDisplay(grouped);
              const isScheduled = grouped.sections.some(s => isClassScheduled(s.id));
              const allFull = display.totalAvailable === 0 && display.totalSeats > 0;

              // Check if any section of this class would have time conflicts
              const hasConflicts = grouped.sections.some(section => {
                const scheduledClass: ScheduledClass = {
                  id: section.id,
                  subject: grouped.subject,
                  number: grouped.number,
                  courseNumber: grouped.number,
                  title: grouped.title,
                  time: section.time || (section.meetingTimes?.[0] ?
                    `${section.meetingTimes[0].days || ''} ${section.meetingTimes[0].startTime || ''}-${section.meetingTimes[0].endTime || ''}`.trim()
                    : 'TBA'),
                  instructor: section.instructor || 'TBA',
                  location: section.location || section.meetingTimes?.[0]?.location || 'TBA',
                  credits: grouped.credits || section.credits || 3,
                  color: 'blue',
                };
                return hasTimeConflict(scheduledClass, scheduledClasses);
              });

              return (
                <TableRow
                  key={`${grouped.subject}-${grouped.number}`}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    isScheduled ? 'opacity-50' : hasConflicts ? 'opacity-60 bg-red-500/5' : ''
                  }`}
                  onClick={() => handleClassClick(grouped)}
                >
                  <TableCell className="font-medium">
                    {grouped.subject} {grouped.number}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div>
                      <div>{grouped.title}</div>
                      {grouped.labSections && grouped.labSections.length > 0 && (
                        <span className="text-xs text-muted-foreground">+Lab</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{grouped.credits || 3}</TableCell>
                  <TableCell>
                    {isScheduled ? (
                      <Badge variant="secondary" className="text-xs">Added</Badge>
                    ) : hasConflicts ? (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive">Conflict</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={allFull}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassClick(grouped);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      </div>
    </div>
  );
}