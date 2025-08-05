"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Star, Plus, ChevronDown, Clock, MapPin, Users, TrendingUp, Award, BookOpen, Check } from "lucide-react"
import { ExpandableClassCard } from "@/components/expandable-class-card"
import { RatingDistributionBarChart } from "@/components/rating-distribution-bar-chart"
import { findProfessorRatingAsync, generateFallbackData } from "@/lib/professor-matcher"

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
  available_seats?: number
  total_seats?: number
  type?: string  // ADDED: Class type (Lecture, Lab with No Credit, etc.)
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
  labSections?: ClassData[]
}

interface GroupedClassCardProps {
  groupedClass: GroupedClass
  onAddToSchedule: (classData: ClassData) => void
  onRemoveFromSchedule: (classId: string) => void
  isAnyScheduled: boolean
  scheduledClasses?: ClassData[] // Add this to help find which section to remove
}

// Truncate long meeting times for better display
const truncateTime = (timeString: string, maxLength: number = 25) => {
  if (timeString.length <= maxLength) return timeString;
  return timeString.substring(0, maxLength - 3) + '...';
};

// Get seat availability badge and info
const getSeatAvailability = (availableSeats?: number, totalSeats?: number) => {
  if (availableSeats === undefined || totalSeats === undefined) {
    return { badge: null, text: 'TBA' };
  }
  
  let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';
  let badgeText = 'TBA';
  let badgeClass = '';
  
  if (availableSeats > 10) {
    badgeText = 'Open';
    badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (availableSeats > 0) {
    badgeText = 'Limited';
    badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else {
    badgeText = 'Full';
    badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  
  return {
    badge: { text: badgeText, className: badgeClass },
    text: `${availableSeats}/${totalSeats}`
  };
};

// Detect lecture/lab patterns in sections
const analyzeSections = (sections: ClassData[]) => {
  // Group sections by time + instructor + location
  const groups = new Map<string, ClassData[]>();
  
  sections.forEach(section => {
    const key = `${section.time}|${section.instructor}|${section.location}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(section);
  });
  
  // If multiple sections share same time/instructor/location, they're likely lecture + labs
  const sectionLabels = new Map<string, string>();
  
  groups.forEach((groupSections, key) => {
    if (groupSections.length > 1) {
      // Sort by total seats (lecture usually has more seats)
      const sorted = [...groupSections].sort((a, b) => (b.total_seats || 0) - (a.total_seats || 0));
      
      sorted.forEach((section, index) => {
        if (index === 0 && (section.total_seats || 0) > 50) {
          sectionLabels.set(section.id, 'Lecture');
        } else {
          sectionLabels.set(section.id, `Lab ${String.fromCharCode(65 + index)}`); // Lab A, Lab B, etc.
        }
      });
    } else {
      // Single section, check if it looks like a lab by class code or title
      const section = groupSections[0];
      if (section.title.toLowerCase().includes('lab') || 
          section.location.toLowerCase().includes('lab')) {
        sectionLabels.set(section.id, 'Lab');
      }
    }
  });
  
  return sectionLabels;
};

// Generate varied student comments based on instructor name to avoid identical comments
const generateStudentTags = (instructorName: string, rating: number) => {
  const allTags = [
    "Clear lectures", "Helpful", "Tough grader", "Fair grading", "Engaging", 
    "Knowledgeable", "Accessible", "Great examples", "Well organized", "Caring",
    "Challenging", "Inspirational", "Patient", "Thorough", "Practical",
    "Good feedback", "Responsive", "Understanding", "Detailed", "Enthusiastic"
  ];
  
  // Use instructor name as seed for consistent but varied selection
  const seed = instructorName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const shuffled = [...allTags].sort(() => (seed % 3) - 1);
  
  // Select 3-4 tags, biased by rating
  const numTags = rating > 3.5? 4 : 3;
  return shuffled.slice(0, numTags);
};

export function GroupedClassCard({ 
  groupedClass, 
  onAddToSchedule, 
  onRemoveFromSchedule,
  isAnyScheduled,
  scheduledClasses = []
}: GroupedClassCardProps) {
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>("")
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [professorRating, setProfessorRating] = React.useState<any>(null)
  const [loadingRating, setLoadingRating] = React.useState(false)
  const [sectionPopoverOpen, setSectionPopoverOpen] = React.useState(false)
  
  // Close dropdown on scroll
  React.useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container="class-list"]')
    if (!scrollContainer) return

    const handleScroll = () => {
      if (sectionPopoverOpen) {
        setSectionPopoverOpen(false)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [sectionPopoverOpen])
  
  // Analyze sections for lecture/lab patterns
  const sectionLabels = React.useMemo(() => analyzeSections(groupedClass.sections), [groupedClass.sections])
  
  // Get the best rated section as default
  const bestSection = groupedClass.sections.reduce((best, current) => 
    (current.rating || 0) > (best.rating || 0) ? current : best
  )
  
  const selectedSection = selectedSectionId 
    ? groupedClass.sections.find(s => s.id === selectedSectionId) || bestSection
    : bestSection

  // Load professor rating data when section changes
  React.useEffect(() => {
    if (!selectedSection.instructor || selectedSection.instructor.toLowerCase().includes('tba')) {
      setProfessorRating(null)
      return
    }

    // Use rating data from the selected section (already from backend API)
    if (selectedSection.rating !== undefined || selectedSection.difficulty !== undefined || selectedSection.wouldTakeAgain !== undefined) {
      // Only set if we have meaningful rating data
      if (selectedSection.rating > 0) {
        setProfessorRating({
          name: selectedSection.instructor,
          rating: selectedSection.rating || 0,
          difficulty: selectedSection.difficulty || 0,
          wouldTakeAgain: selectedSection.wouldTakeAgain || 0,
          ratingDistribution: selectedSection.ratingDistribution || [0, 0, 0, 0, 0],
          tags: [] // Not available in class API
        })
        setLoadingRating(false)
        return
      }
    }

    // Fallback to async API call for detailed data
    const loadProfessorRating = async () => {
      setLoadingRating(true)
      try {
        const rating = await findProfessorRatingAsync(selectedSection.instructor)
        setProfessorRating(rating)
      } catch (error) {
        console.error('Failed to load professor rating:', error)
        setProfessorRating(null)
      } finally {
        setLoadingRating(false)
      }
    }

    loadProfessorRating()
  }, [selectedSection.instructor, selectedSection.rating, selectedSection.difficulty, selectedSection.wouldTakeAgain])


  const handleAddToSchedule = () => {
    if (selectedSection) {
      if (isAnyScheduled) {
        // Find ANY scheduled section from this class group and remove it
        const scheduledSection = groupedClass.sections.find(section => 
          scheduledClasses.some(scheduled => scheduled.id === section.id)
        );
        if (scheduledSection) {
          onRemoveFromSchedule(scheduledSection.id)
        }
      } else {
        onAddToSchedule(selectedSection)
      }
    }
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`border rounded text-card-foreground hover:shadow-md transition-all duration-200 px-3 py-1.5 mb-1 ${
        isAnyScheduled 
          ? 'bg-card opacity-80 border-border' 
          : 'bg-card hover:bg-card/90'
      }`}>
          {/* Collapsed View */}
          <div className="space-y-1.5">
          {/* Class Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isAnyScheduled ? "secondary" : "outline"} 
                  className={`text-lg font-mono font-semibold ${
                    isAnyScheduled ? 'bg-muted/80 text-foreground border-border' : ''
                  }`}
                >
                  {groupedClass.subject} {groupedClass.number}
                </Badge>
                <span className="text-lg text-foreground font-medium">{selectedSection.instructor}</span>
                <div className="flex items-center gap-1">
                  {professorRating && professorRating.rating > 0 && (
                    <>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                        <path d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z" fill="currentColor"></path>
                      </svg>
                      <span className="text-base font-medium text-muted-foreground">{professorRating.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight mt-2 truncate">
                {groupedClass.title}
              </h3>
              <div className="text-base text-muted-foreground mt-1 font-medium">
                {groupedClass.sections.length > 1 && (
                  <span>{groupedClass.sections.length} sections available</span>
                )}
                {groupedClass.labSections && groupedClass.labSections.length > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    {groupedClass.sections.length > 1 ? ' • ' : ''}
                    Requires Lab
                  </span>
                )}
              </div>
            </div>
            
          </div>

          {/* Section Selection - always show */}
          <div className="flex items-start">
            <div className="flex-1">
              {groupedClass.sections.length > 1 ? (
                <Popover open={sectionPopoverOpen} onOpenChange={setSectionPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className={`w-full cursor-pointer hover:bg-muted/50 rounded-sm ${isExpanded ? 'opacity-50' : ''}`}>
                      <div className="text-sm text-foreground flex flex-col justify-start items-start">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-base">{truncateTime(selectedSection.time)}</div>
                          {sectionLabels.get(selectedSection.id) && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {sectionLabels.get(selectedSection.id)}
                            </Badge>
                          )}
                          <ChevronDown
                            size={20}
                            className="text-muted-foreground/80 shrink-0 ml-1"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const seatInfo = getSeatAvailability(selectedSection.available_seats, selectedSection.total_seats);
                            return (
                              <>
                                {seatInfo.badge && seatInfo.badge.text === 'Full' && (
                                  <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 rounded-sm ${seatInfo.badge.className}`}>
                                    {seatInfo.badge.text}
                                  </Badge>
                                )}
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-mono">
                                  {seatInfo.text}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-full max-w-[600px] p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={8}
                    container={typeof document !== 'undefined' ? document.querySelector('[data-scroll-container="class-list"]') : undefined}
                  >
                    <Command>
                      <CommandList>
                        <CommandEmpty>No sections found.</CommandEmpty>
                        <CommandGroup>
                          {groupedClass.sections.map((section) => (
                            <CommandItem
                              key={section.id}
                              value={section.id}
                              onSelect={() => {
                                setSelectedSectionId(section.id)
                                setSectionPopoverOpen(false)
                              }}
                              className={`${
                                (selectedSectionId || selectedSection.id) === section.id 
                                  ? "bg-accent/50 border-l-2 border-l-primary" 
                                  : ""
                              }`}
                            >
                              <div className="flex flex-col items-start w-full gap-1">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{section.time}</span>
                                    {sectionLabels.get(section.id) && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                        {sectionLabels.get(section.id)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {section.available_seats || 0}/{section.total_seats || 0}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-muted-foreground text-sm">
                                  {section.instructor} • {section.location}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className={`text-sm text-foreground flex flex-col justify-center ${isExpanded ? 'opacity-50' : ''}`}>
                  <div className="font-medium text-base">{truncateTime(selectedSection.time)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const seatInfo = getSeatAvailability(selectedSection.available_seats, selectedSection.total_seats);
                      return (
                        <>
                          {seatInfo.badge && seatInfo.badge.text === 'Full' && (
                            <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 rounded-sm ${seatInfo.badge.className}`}>
                              {seatInfo.badge.text}
                            </Badge>
                          )}
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">
                            {seatInfo.text}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-2 mt-1 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="group h-10 w-10 rounded-sm"
                    variant="outline"
                    size="icon"
                    onClick={handleToggleExpanded}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Hide details" : "Show details"}
                  >
                    <svg
                      className="pointer-events-none"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 12L20 12"
                        className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                      />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-white border border-gray-200 text-gray-900 px-2 py-1 text-xs shadow-md rounded-md"
                  sideOffset={5}
                >
                  Course Details
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={`group h-10 w-10 transition-all duration-300 ${
                      isAnyScheduled 
                        ? 'bg-muted/80 border-border text-muted-foreground hover:bg-muted' 
                        : ''
                    }`}
                    variant={isAnyScheduled ? "secondary" : "outline"}
                    size="icon"
                    onClick={handleAddToSchedule}
                    aria-label={isAnyScheduled ? "Remove from schedule" : "Add to schedule"}
                  >
                    <Plus
                      className={`transition-all duration-300 ${
                        isAnyScheduled ? 'text-muted-foreground rotate-45' : ''
                      }`}
                      size={16}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-white border border-gray-200 text-gray-900 px-2 py-1 text-xs shadow-md rounded-md"
                  sideOffset={5}
                >
                  {isAnyScheduled ? "Remove Class" : "Add Class"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Expanded View - show the beautiful detailed view directly */}
        {isExpanded && selectedSection && (
          <div className="mt-6 pt-4 border-t border-border space-y-4">

            {/* Class details */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedSection.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{selectedSection.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{selectedSection.credits || 3} Credits</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {(() => {
                    const seatInfo = getSeatAvailability(selectedSection.available_seats, selectedSection.total_seats);
                    return (
                      <>
                        <span>{seatInfo.text} seats</span>
                        {seatInfo.badge && (
                          <Badge variant="secondary" className={`text-xs px-2 py-0.5 rounded-sm ${seatInfo.badge.className}`}>
                            {seatInfo.badge.text}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Professor ratings section */}
            {!selectedSection.instructor.toLowerCase().includes('tba') && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {selectedSection.instructor}
                  </span>
                  {loadingRating && (
                    <span className="text-xs text-muted-foreground">Loading ratings...</span>
                  )}
                </div>

                {/* Rating metrics - sleek and compact */}
                <div className="flex items-center justify-between gap-4 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Star className={`h-3.5 w-3.5 ${
                      professorRating?.rating >= 4.0 
                        ? 'fill-green-500 text-green-500' 
                        : professorRating?.rating >= 2.5 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'fill-red-500 text-red-500'
                    }`} />
                    <span className={`font-semibold text-sm ${
                      professorRating?.rating >= 4.0 
                        ? 'text-green-600' 
                        : professorRating?.rating >= 2.5 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {loadingRating ? '...' : (professorRating?.rating?.toFixed(1) || 'N/A')}
                    </span>
                    <span className="text-muted-foreground text-xs">Rating</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold text-sm">
                      {loadingRating ? '...' : (professorRating?.difficulty?.toFixed(1) || 'N/A')}
                    </span>
                    <span className="text-muted-foreground text-xs">Difficulty</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-semibold text-sm">
                      {loadingRating ? '...' : `${Math.round(professorRating?.wouldTakeAgain || 0)}%`}
                    </span>
                    <span className="text-muted-foreground text-xs">Would Take</span>
                  </div>
                </div>

                {/* Rating Distribution Chart */}
                {professorRating && professorRating.rating > 0 && (
                  <div className="space-y-3">
                    <RatingDistributionBarChart 
                      ratingDistribution={professorRating?.ratingDistribution || [0, 0, 0, 0, 0]}
                      professorName={selectedSection.instructor}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Student Comments - only show if we have tags */}
                {(loadingRating || (professorRating?.tags || []).length > 0) && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {loadingRating ? (
                      <Badge variant="secondary" className="text-sm px-3 py-1.5">
                        Loading tags...
                      </Badge>
                    ) : (
                      (professorRating?.tags || []).slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm px-3 py-1.5 rounded-sm"
                        >
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}