"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScheduleErrorType = "time_conflict" | "missing_prerequisites";

interface TimeConflict {
  class_id: string;
  subject: string;
  number: string;
  title: string;
  time: string;
  days: string[];
}

interface MissingPrerequisite {
  type: "required" | "or";
  courses: string[];
  message: string;
}

interface ScheduleErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: ScheduleErrorType;
  classInfo: {
    subject: string;
    number: string;
    title: string;
  };
  conflicts?: TimeConflict[];
  missingPrerequisites?: MissingPrerequisite[];
  onAddAnyway?: () => void;
  allowAddAnyway?: boolean;
}

export function ScheduleErrorDialog({
  isOpen,
  onClose,
  errorType,
  classInfo,
  conflicts = [],
  missingPrerequisites = [],
  onAddAnyway,
  allowAddAnyway = false,
}: ScheduleErrorDialogProps) {
  const isTimeConflict = errorType === "time_conflict";
  const isMissingPrereqs = errorType === "missing_prerequisites";

  // Don't render if no class info
  if (!classInfo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isTimeConflict ? (
              <Clock className="h-5 w-5 text-red-500" />
            ) : (
              <BookOpen className="h-5 w-5 text-amber-500" />
            )}
            <DialogTitle>
              {isTimeConflict ? "Schedule Conflict" : "Prerequisites Not Met"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Cannot add <span className="font-semibold">{classInfo.subject} {classInfo.number}</span> - {classInfo.title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isTimeConflict && conflicts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Time conflicts detected with:</span>
              </div>
              <div className="space-y-2 pl-6">
                {conflicts.map((conflict, index) => (
                  <div 
                    key={conflict.class_id || index}
                    className="p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="font-medium text-sm">
                      {conflict.subject} {conflict.number} - {conflict.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conflict.time} • {conflict.days.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMissingPrereqs && missingPrerequisites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Missing prerequisites:</span>
              </div>
              <div className="space-y-2 pl-6">
                {missingPrerequisites.map((prereq, index) => (
                  <div 
                    key={index}
                    className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="text-sm">
                      {prereq.type === "or" ? (
                        <>
                          <span className="text-xs text-muted-foreground">Need one of:</span>
                          <div className="font-medium mt-1">{prereq.message}</div>
                        </>
                      ) : (
                        <div className="font-medium">{prereq.message}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          {allowAddAnyway && isMissingPrereqs && onAddAnyway && (
            <Button 
              variant="destructive"
              onClick={() => {
                onAddAnyway();
                onClose();
              }}
            >
              Add Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}