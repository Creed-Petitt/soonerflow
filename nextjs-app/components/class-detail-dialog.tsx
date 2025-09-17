"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  MapPin,
  User,
  Star,
  TrendingUp,
  Award,
  Users,
  Gauge,
  ThumbsUp,
} from "lucide-react";
import { ProfessorRatingBarChart } from "@/components/professor-rating-bar-chart";
import { useSchedule } from "@/hooks/use-schedule";
import { cleanDescription, formatPrerequisites } from "@/utils/course-utils";
import { useProfessorData } from "@/hooks/useProfessorData";

interface ClassDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupedClass: any;
  onAddToSchedule: (section: any, labSection?: any) => void;
  selectedSection?: any; // Pre-selected section for change mode
  isChangeMode?: boolean; // If true, this is for changing existing class
}


export function ClassDetailDialog({
  isOpen,
  onClose,
  groupedClass,
  onAddToSchedule,
  selectedSection,
  isChangeMode = false
}: ClassDetailDialogProps) {
  const [currentView, setCurrentView] = React.useState<"class" | "professor">("class");
  const [currentSection, setCurrentSection] = React.useState<any>(null);
  const [currentLabSection, setCurrentLabSection] = React.useState<any>(null);
  const { professorData, loading: loadingProfessor, loadProfessorData, clearProfessorData } = useProfessorData();
  
  // Track original selections for change mode
  const [originalSection, setOriginalSection] = React.useState<any>(null);
  const [originalLabSection, setOriginalLabSection] = React.useState<any>(null);

  React.useEffect(() => {
    // Reset state when dialog opens with new class
    if (isOpen && groupedClass) {
      // Set section - use selectedSection prop if provided, otherwise first section
      const initialSection = selectedSection || (groupedClass.sections && groupedClass.sections.length > 0 ? groupedClass.sections[0] : null);
      setCurrentSection(initialSection);
      
      // Reset lab selection
      setCurrentLabSection(null);
      
      // Reset view to class tab
      setCurrentView("class");
      
      // Store original selections for change mode
      if (isChangeMode) {
        setOriginalSection(initialSection);
        setOriginalLabSection(null);
      } else {
        setOriginalSection(null);
        setOriginalLabSection(null);
      }
    }
  }, [isOpen, groupedClass, selectedSection, isChangeMode]);

  // Load professor data when section changes
  React.useEffect(() => {
    if (currentSection?.instructor) {
      loadProfessorData(currentSection.instructor);
    } else {
      clearProfessorData();
    }
  }, [currentSection?.instructor, loadProfessorData, clearProfessorData]);

  if (!groupedClass) return null;

  const totalSeats = currentSection?.total_seats ?? currentSection?.totalSeats;
  const availableSeats = currentSection?.available_seats ?? currentSection?.availableSeats;
  const seatPercentage = totalSeats ? 
    ((totalSeats - availableSeats) / totalSeats) * 100 : 0;

  // Helper functions for change detection
  const hasChangedSection = isChangeMode && originalSection && currentSection && originalSection.id !== currentSection.id;
  const hasChangedLab = isChangeMode && originalLabSection !== currentLabSection;
  const hasAnyChanges = hasChangedSection || hasChangedLab;
  
  // Determine button text and availability
  const getButtonText = () => {
    if (!isChangeMode) return "Add to Schedule";
    if (!hasAnyChanges) return null; // No button when no changes
    if (hasChangedSection && hasChangedLab) return "Change Section & Lab";
    if (hasChangedSection) return "Change Section";
    if (hasChangedLab) return "Change Lab";
    return null;
  };
  
  const buttonText = getButtonText();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[600px] w-full min-h-[85vh] max-h-[90vh] h-[88vh] p-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="scroll-m-20 text-2xl font-bold tracking-tight sans-serif">
                {groupedClass.subject} {groupedClass.number || groupedClass.courseNumber}
              </DialogTitle>
              <p className="text-lg leading-6 sans-serif mt-3 whitespace-nowrap">{groupedClass.title}</p>
              <p className="text-sm text-muted-foreground sans-serif mt-0 -mb-2">{groupedClass.credits || currentSection?.credits || 3} Credits</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant={currentView === "class" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("class")}
                className="text-sm h-8 px-2 sm:px-4 sans-serif min-w-0"
              >
                Class
              </Button>
              <Button
                variant={currentView === "professor" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("professor")}
                className="text-sm h-8 px-2 sm:px-4 sans-serif min-w-0"
              >
                Professor
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 px-6 py-2 space-y-3 overflow-hidden">
          {currentView === "class" ? (
            <>
              {groupedClass.sections && groupedClass.sections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium sans-serif -mt-2">Section</h4>
                  {groupedClass.sections.length > 1 ? (
                    <Select
                      value={currentSection?.id || ''}
                      onValueChange={(value) => {
                        const section = groupedClass.sections.find((s: any) => s.id === value);
                        if (section) setCurrentSection(section);
                      }}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedClass.sections.map((section: any) => {
                          const time = section.meetingTimes?.[0] ? 
                            `${section.meetingTimes[0].days || ''} ${section.meetingTimes[0].startTime || ''}-${section.meetingTimes[0].endTime || ''}`.trim() || 'TBA' 
                            : section.time || 'TBA';
                          return (
                            <SelectItem key={section.id} value={section.id}>
                              {time} - {section.instructor || 'TBA'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : currentSection ? (
                    <div className="h-9 px-3 flex items-center text-sm border rounded-md bg-muted/50">
                      {currentSection.meetingTimes?.[0] ? 
                        `${currentSection.meetingTimes[0].days || ''} ${currentSection.meetingTimes[0].startTime || ''}-${currentSection.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
                        : currentSection.time || 'TBA'} - {currentSection.instructor || 'TBA'}
                    </div>
                  ) : null}
                </div>
              )}
              {groupedClass.labSections && groupedClass.labSections.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium sans-serif">Lab Section (Required)</h4>
                  <Select
                    value={currentLabSection?.id || ''}
                    onValueChange={(value) => {
                      if (value) {
                        const lab = groupedClass.labSections.find((l: any) => l.id === value);
                        if (lab) setCurrentLabSection(lab);
                      } else {
                        setCurrentLabSection(null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select a lab section..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedClass.labSections.map((lab: any) => {
                        const time = lab.meetingTimes?.[0] ? 
                          `${lab.meetingTimes[0].days || ''} ${lab.meetingTimes[0].startTime || ''}-${lab.meetingTimes[0].endTime || ''}`.trim() || 'TBA' 
                          : lab.time || 'TBA';
                        const location = lab.meetingTimes?.[0]?.location || lab.location || 'TBA';
                        return (
                          <SelectItem key={lab.id} value={lab.id}>
                            {time} - {location}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {currentSection?.meetingTimes?.[0] ? 
                      `${currentSection.meetingTimes[0].days || ''} ${currentSection.meetingTimes[0].startTime || ''}-${currentSection.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
                      : currentSection?.time || 'TBA'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{currentSection?.meetingTimes?.[0]?.location || currentSection?.location || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentSection?.instructor || 'TBA'}</span>
                </div>
                {(currentSection?.total_seats !== undefined || currentSection?.totalSeats !== undefined) && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available Seats</span>
                      <span className="font-medium">
                        {currentSection.available_seats ?? currentSection.availableSeats}/{currentSection.total_seats ?? currentSection.totalSeats}
                      </span>
                    </div>
                    <Progress value={seatPercentage} className="h-2" />
                  </div>
                )}
              </div>
              
              {currentSection?.prerequisites && currentSection.prerequisites.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <h4 className="text-sm font-medium sans-serif">Prerequisites</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatPrerequisites(currentSection.prerequisites)}
                  </p>
                </div>
              )}

              {currentSection?.description && (
                <div className="space-y-2 pt-3 border-t">
                  <h4 className="text-sm font-medium sans-serif">Course Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
                    {cleanDescription(currentSection.description)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {loadingProfessor ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading professor information...
                </div>
              ) : professorData ? (
                <>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{professorData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSection?.subject} Department
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-1 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{professorData.rating.toFixed(1)}</p>
                      <div className="flex gap-0.5 justify-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(professorData.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : i < professorData.rating
                                ? 'fill-yellow-400/50 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Overall</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{professorData.difficulty.toFixed(1)}</p>
                      <div className="flex justify-center">
                        <Gauge 
                          className={`h-4 w-4 ${
                            professorData.difficulty <= 2 
                              ? 'text-green-500'
                              : professorData.difficulty <= 3.5 
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Difficulty</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(professorData.wouldTakeAgain)}%</p>
                      <div className="flex justify-center">
                        <ThumbsUp 
                          className={`h-4 w-4 ${
                            professorData.wouldTakeAgain >= 70 
                              ? 'text-green-500 fill-green-500/20'
                              : professorData.wouldTakeAgain >= 50 
                              ? 'text-yellow-500 fill-yellow-500/20'
                              : 'text-red-500 fill-red-500/20'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Would Take Again</p>
                    </div>
                  </div>
                  {professorData.tags && professorData.tags.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-medium">What Students Say</h4>
                      <div className="flex flex-wrap gap-2">
                        {professorData.tags.slice(0, 4).map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {professorData.ratingDistribution && (
                    <div className="pt-1">
                      <h4 className="text-sm font-medium mb-1">Rating Distribution</h4>
                      <ProfessorRatingBarChart ratingDistribution={professorData.ratingDistribution} />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground pt-2">
                    Based on {professorData.totalRatings} ratings from RateMyProfessor
                  </p>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No professor information available
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t shrink-0">
          {buttonText ? (
            <Button
              className="w-full"
              onClick={() => {
                // Pass both section and lab (if selected) to the handler
                onAddToSchedule(currentSection, currentLabSection);
                
                onClose();
              }}
              disabled={
                // Disable if lab is required but not selected
                groupedClass.labSections && groupedClass.labSections.length > 0 && !currentLabSection
              }
            >
              {groupedClass.labSections && groupedClass.labSections.length > 0 && !currentLabSection
                ? "Select a lab section to continue"
                : buttonText}
            </Button>
          ) : isChangeMode ? (
            <div className="text-center text-sm text-muted-foreground py-3">
              Select a different section or lab to make changes
            </div>
          ) : (
            <Button className="w-full" disabled>
              Add to Schedule
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}