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
  Clock,
  MapPin,
  User,
  Star,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { ProfessorRatingBarChart } from "@/components/professor-rating-bar-chart";
import { useSchedule } from "@/hooks/use-schedule";

interface ClassDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupedClass: any;
  selectedSection: any;
  onAddToSchedule: (section: any) => void;
}

// Helper function to clean HTML and boilerplate text from description
function cleanDescription(description: string): string {
  if (!description) return description;
  
  let cleaned = description
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const boilerplatePatterns = [
    /This course\/section has been selected for the Inclusive Access \(IA\) program.*?Check here to view the savings for your course material: https:\/\/link\.ou\.edu\/ia-savings\s*/gi,
    /STUDENTS MUST ENROLL IN ONE OF THE FOLLOWING CO-REQUISITE:.*?\s*/gi,
    /Co-requisite:.*?\s*/gi,
    /Corequisite:.*?\s*/gi
  ];
  
  boilerplatePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function ClassDetailDialog({
  isOpen,
  onClose,
  groupedClass,
  selectedSection,
  onAddToSchedule
}: ClassDetailDialogProps) {
  const [currentView, setCurrentView] = React.useState<"class" | "professor">("class");
  const [currentSection, setCurrentSection] = React.useState(selectedSection);
  const [currentLabSection, setCurrentLabSection] = React.useState<any>(null);
  const [professorData, setProfessorData] = React.useState<any>(null);
  const [loadingProfessor, setLoadingProfessor] = React.useState(false);

  React.useEffect(() => {
    if (selectedSection) {
      setCurrentSection(selectedSection);
    }
  }, [selectedSection]);

  // Load professor data when section changes
  React.useEffect(() => {
    if (currentSection?.instructor && currentSection.instructor !== 'TBA') {
      const loadProfessorData = async () => {
        setLoadingProfessor(true);
        try {
          // Parse instructor name (usually "Last, First")
          const nameParts = currentSection.instructor.split(',').map((p: string) => p.trim());
          const searchName = nameParts.length > 1 ? 
            `${nameParts[1]} ${nameParts[0]}` : currentSection.instructor;
          
          const response = await fetch(`/api/professors/search?name=${encodeURIComponent(searchName)}`);
          if (response.ok) {
            const prof = await response.json();
            if (prof && prof.id) {
              setProfessorData({
                name: `${prof.firstName} ${prof.lastName}`,
                rating: prof.avgRating || 0,
                difficulty: prof.avgDifficulty || 0,
                wouldTakeAgain: prof.wouldTakeAgainPercent || 0,
                totalRatings: prof.numRatings || 0,
                tags: prof.tags || [],
                ratingDistribution: prof.ratingDistribution || [0, 0, 0, 0, 0]
              });
            }
          }
        } catch (error) {
          console.error('Error loading professor data:', error);
        }
        setLoadingProfessor(false);
      };
      loadProfessorData();
    }
  }, [currentSection]);

  if (!groupedClass) return null;

  const seatPercentage = currentSection?.totalSeats ? 
    ((currentSection.totalSeats - currentSection.availableSeats) / currentSection.totalSeats) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[50vw] w-full h-[80vh] p-0 flex flex-col">
        {/* Compact Header */}
        <div className="px-6 pt-4 pb-1 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="scroll-m-20 text-2xl font-bold tracking-tight sans-serif">
                {groupedClass.subject} {groupedClass.number}
              </DialogTitle>
              <p className="text-lg leading-6 sans-serif mt-3 whitespace-nowrap">{groupedClass.title}</p>
              <p className="text-sm text-muted-foreground sans-serif mt-0 -mb-2">{groupedClass.credits || 3} Credits</p>
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
        
        {/* Body */}
        <div className="flex-1 min-h-[450px] px-6 py-1 space-y-2 overflow-y-auto">
          {currentView === "class" ? (
            <>
              {/* Section Selector */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium sans-serif -mt-2">Section</h4>
                {groupedClass.sections && groupedClass.sections.length > 1 ? (
                  <select
                    value={currentSection?.id}
                    onChange={(e) => {
                      const section = groupedClass.sections.find((s: any) => s.id === e.target.value);
                      if (section) setCurrentSection(section);
                    }}
                    className="w-full h-9 px-3 text-sm border rounded-md bg-background"
                  >
                    {groupedClass.sections.map((section: any) => (
                      <option key={section.id} value={section.id}>
                        {section.time || 'TBA'} - {section.instructor || 'TBA'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-9 px-3 flex items-center text-sm border rounded-md bg-muted/50">
                    {currentSection?.time || 'TBA'} - {currentSection?.instructor || 'TBA'}
                  </div>
                )}
              </div>

              {/* Lab Section Selector - only show if labs exist */}
              {groupedClass.labSections && groupedClass.labSections.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium sans-serif">Lab Section (Required)</h4>
                  <select
                    value={currentLabSection?.id || ''}
                    onChange={(e) => {
                      const lab = groupedClass.labSections.find((l: any) => l.id === e.target.value);
                      if (lab) setCurrentLabSection(lab);
                    }}
                    className="w-full h-9 px-3 text-sm border rounded-md bg-background"
                  >
                    <option value="">Select a lab section...</option>
                    {groupedClass.labSections.map((lab: any) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.time || 'TBA'} - {lab.location || 'TBA'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Meeting Info */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{currentSection?.time || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{currentSection?.location || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentSection?.instructor || 'TBA'}</span>
                </div>
                
                {/* Seats Progress Bar */}
                {currentSection?.totalSeats !== undefined && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available Seats</span>
                      <span className="font-medium">
                        {currentSection.availableSeats}/{currentSection.totalSeats}
                      </span>
                    </div>
                    <Progress value={seatPercentage} className="h-2" />
                  </div>
                )}
              </div>

              {/* Course Description */}
              {currentSection?.description && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="text-sm font-medium sans-serif">Course Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {cleanDescription(currentSection.description)}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Professor View */
            <div className="space-y-4">
              {loadingProfessor ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading professor information...
                </div>
              ) : professorData ? (
                <>
                  {/* Professor Header */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{professorData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSection?.subject} Department
                    </p>
                  </div>

                  {/* Rating Overview */}
                  <div className="grid grid-cols-3 gap-4 pt-2 text-center">
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
                      <p className="text-xs text-muted-foreground mt-4">Difficulty</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(professorData.wouldTakeAgain)}%</p>
                      <p className="text-xs text-muted-foreground mt-4">Would Take Again</p>
                    </div>
                  </div>

                  {/* Tags */}
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

                  {/* Rating Distribution */}
                  {professorData.ratingDistribution && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Rating Distribution</h4>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0">
          <Button
            className="w-full"
            onClick={() => {
              console.log('Add to Schedule button clicked!');
              console.log('Current section:', currentSection);
              
              // Add the lecture section
              onAddToSchedule(currentSection);
              
              // If lab is required and selected, add it too
              if (groupedClass.labSections && groupedClass.labSections.length > 0 && currentLabSection) {
                console.log('Adding lab section:', currentLabSection);
                onAddToSchedule(currentLabSection);
              }
              
              onClose();
            }}
            disabled={
              // Disable if lab is required but not selected
              groupedClass.labSections && groupedClass.labSections.length > 0 && !currentLabSection
            }
          >
            {groupedClass.labSections && groupedClass.labSections.length > 0 && !currentLabSection
              ? "Select a lab section to continue"
              : "Add to Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}