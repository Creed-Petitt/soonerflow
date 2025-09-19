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

interface ClassBrowserTableProps {
  filteredGroupedClasses: GroupedClass[];
  isLoading: boolean;
  selectedDepartment: string;
  totalClassCount: number;
  groupedClassesLength: number;
  handleClassClick: (grouped: GroupedClass) => void;
  isClassScheduled: (id: string) => boolean;
  loadMoreClasses: () => void;
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
  selectedDepartment,
  totalClassCount,
  groupedClassesLength,
  handleClassClick,
  isClassScheduled,
  loadMoreClasses,
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
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Loading classes...
              </TableCell>
            </TableRow>
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

              return (
                <TableRow
                  key={`${grouped.subject}-${grouped.number}`}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    isScheduled ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleClassClick(grouped)}
                >
                  <TableCell className="font-medium">
                    {grouped.subject} {grouped.number}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div>
                      <div>{grouped.title}</div>
                      {grouped.labSections.length > 0 && (
                        <span className="text-xs text-muted-foreground">+Lab</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{grouped.credits || 3}</TableCell>
                  <TableCell>
                    {isScheduled ? (
                      <Badge variant="secondary" className="text-xs">Added</Badge>
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

      {/* Load More Button */}
      {selectedDepartment === "all" && groupedClassesLength < totalClassCount && (
        <div className="p-4 text-center">
          <Button
            onClick={loadMoreClasses}
            variant="outline"
            className="w-full"
          >
`Load More (${totalClassCount - groupedClassesLength} remaining)`
          </Button>
        </div>
      )}

      {selectedDepartment === "all" && groupedClassesLength >= totalClassCount && totalClassCount > 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          All {totalClassCount} classes loaded
        </div>
      )}
      </div>
    </div>
  );
}