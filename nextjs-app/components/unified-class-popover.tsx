"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Clock,
  Star,
  Plus,
  MapPin,
  TrendingUp,
  Award,
  ChevronDown,
  Check,
} from "lucide-react";
import { findProfessorRatingAsync } from "@/lib/professor-matcher";
import { ProfessorRatingBarChart } from "@/components/professor-rating-bar-chart";

// Custom SVG Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

interface ClassData {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  time: string
  location: string
  credits?: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
  ratingDistribution?: number[]
  tags?: string[]
  available_seats?: number
  total_seats?: number
  type?: string
  description?: string
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
  labSections?: ClassData[]
}

interface UnifiedClassPopoverProps {
  groupedClass: GroupedClass;
  selectedSection: ClassData;
  onAddToSchedule?: (section: ClassData) => void;
}

// Helper function to convert number to Roman numerals
function toRomanNumeral(num: number): string {
  const romanNumerals = [
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];
  
  let result = '';
  for (const { value, numeral } of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Helper function to clean HTML and boilerplate text from description
function cleanDescription(description: string): string {
  if (!description) return description;
  
  let cleaned = description
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> tags with spaces
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
  
  // Remove common boilerplate text patterns
  const boilerplatePatterns = [
    /This course\/section has been selected for the Inclusive Access \(IA\) program.*?Check here to view the savings for your course material: https:\/\/link\.ou\.edu\/ia-savings\s*/gi,
    /STUDENTS MUST ENROLL IN ONE OF THE FOLLOWING CO-REQUISITE:.*?\s*/gi,
    /Co-requisite:.*?\s*/gi,
    /Corequisite:.*?\s*/gi
  ];
  
  // Remove each boilerplate pattern
  boilerplatePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up any remaining multiple spaces and trim again
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function UnifiedClassPopover({ 
  groupedClass, 
  selectedSection,
  onAddToSchedule 
}: UnifiedClassPopoverProps) {
  const [currentView, setCurrentView] = React.useState<"class" | "professor">("class");
  const [sectionSelectorOpen, setSectionSelectorOpen] = React.useState(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>(selectedSection.id);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  // Get the current section based on selectedSectionId
  const currentSection = React.useMemo(() => {
    return groupedClass.sections.find(s => s.id === selectedSectionId) || selectedSection;
  }, [selectedSectionId, groupedClass.sections, selectedSection]);
  
  // Use professor data that's already loaded with the class - no API call needed
  const professorData = React.useMemo(() => {
    if (!currentSection.rating && !currentSection.difficulty) {
      return null; // No professor data available
    }
    
    return {
      name: currentSection.instructor,
      rating: currentSection.rating || 0,
      difficulty: currentSection.difficulty || 0,
      wouldTakeAgain: currentSection.wouldTakeAgain || 0,
      ratingDistribution: currentSection.ratingDistribution || [0, 0, 0, 0, 0],
      tags: currentSection.tags || [],
      totalRatings: 0 // Not available in class data
    };
  }, [currentSection]);

  const isLoading = false; // No loading needed since data is already available

  const handleAddToSchedule = () => {
    if (onAddToSchedule) {
      onAddToSchedule(currentSection);
      setDialogOpen(false); // Close the modal after adding
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-10 px-4 text-sm font-medium sans-serif hover:bg-accent w-full justify-center"
        >
          <span className="flex items-center gap-2">
            <span>{groupedClass.subject} {groupedClass.number}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-medium">{toRomanNumeral(groupedClass.credits || 3)}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[500px] p-0 !fixed !left-4 !top-4 !right-auto !bottom-4 !translate-x-0 !translate-y-0 !m-0 flex flex-col [&>button]:hidden">
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
        
        {/* Body - No scrolling */}
        <div className="flex-1 px-6 py-1 space-y-2">
          {currentView === "class" ? (
            <>
              {/* Meeting Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium sans-serif -mt-2">Section</h4>
                {groupedClass.sections.length > 1 ? (
                  <Popover open={sectionSelectorOpen} onOpenChange={setSectionSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={sectionSelectorOpen}
                        className="w-full justify-between h-9 px-3 text-sm font-normal sans-serif"
                      >
                        <span className="truncate">
                          {currentSection.time} - {currentSection.instructor}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandList className="max-h-[200px]">
                          <CommandGroup>
                            {groupedClass.sections.map((section) => (
                              <CommandItem
                                key={section.id}
                                value={section.id}
                                onSelect={() => {
                                  setSelectedSectionId(section.id);
                                  setSectionSelectorOpen(false);
                                }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm">{section.time}</span>
                                  <span className="text-xs text-muted-foreground">{section.instructor}</span>
                                </div>
                                <Check
                                  className={`ml-2 h-4 w-4 ${
                                    selectedSectionId === section.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : null}
                <div className="space-y-2 text-sm sans-serif">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{currentSection.time || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{currentSection.location || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{currentSection.instructor || 'TBA'}</span>
                  </div>
                </div>
              </div>

              {/* Enrollment */}
              <div className="space-y-2">
                <div className="flex justify-end text-sm text-muted-foreground sans-serif">
                  <div className="flex items-center gap-2">
                    <span>
                      {(currentSection.total_seats || 0) - (currentSection.available_seats || 0)}/{currentSection.total_seats || 0}
                    </span>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <Progress 
                  value={((currentSection.total_seats || 0) - (currentSection.available_seats || 0)) / (currentSection.total_seats || 1) * 100} 
                  className="h-2" 
                />
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium sans-serif">Course Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed sans-serif">
                  {currentSection.description ? 
                    cleanDescription(currentSection.description) :
                    `${groupedClass.title} - Full course description will be loaded from the course catalog.`}
                </p>
              </div>
            </>
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  </div>
                </div>
              ) : (!professorData || professorData?.error) ? (
                <>
                  {/* Professor Name even without rating data */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{currentSection.instructor}</h3>
                    <p className="text-sm text-muted-foreground">Department of {groupedClass.subject}</p>
                  </div>
                  
                  <div className="text-center py-6 text-muted-foreground">
                    <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rating data available for this professor</p>
                    <p className="text-xs mt-1">This professor may not be on RateMyProfessor</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Professor Name with Icon */}
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight sans-serif">{currentSection.instructor}</h3>
                  </div>

                  {/* Rating Stats */}
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold sans-serif">{professorData.rating?.toFixed(1) || 'N/A'}</div>
                      <div className="flex justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${
                              star <= Math.round(professorData.rating || 0)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 sans-serif">Overall</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold sans-serif">{professorData.difficulty?.toFixed(1) || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground mt-1 sans-serif">Difficulty</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold sans-serif">{Math.round(professorData.wouldTakeAgain || 0)}%</div>
                      <p className="text-xs text-muted-foreground mt-1 sans-serif">Would Take Again</p>
                    </div>
                  </div>

                  {/* Rating Distribution Chart */}
                  {professorData.ratingDistribution && Array.isArray(professorData.ratingDistribution) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium sans-serif">Rating Distribution</h4>
                      <ProfessorRatingBarChart 
                        ratingDistribution={professorData.ratingDistribution}
                      />
                    </div>
                  )}

                  {/* Student Tags */}
                  {professorData.tags && professorData.tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium sans-serif">What Students Say</h4>
                      <div className="flex flex-wrap gap-2">
                        {professorData.tags.slice(0, 6).map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2.5 py-1 sans-serif"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-3 py-3 shrink-0">
          <Button 
            variant="default" 
            className="w-full sans-serif"
            onClick={handleAddToSchedule}
          >
            Add to Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


