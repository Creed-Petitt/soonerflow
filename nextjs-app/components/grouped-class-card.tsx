"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Star, Plus, ChevronDown, Clock, MapPin, Users, TrendingUp, Award, BookOpen } from "lucide-react"
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
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
}

interface GroupedClassCardProps {
  groupedClass: GroupedClass
  onAddToSchedule: (classData: ClassData) => void
  onRemoveFromSchedule: (classId: string) => void
  isAnyScheduled: boolean
}

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
  const numTags = rating > 3.5 ? 4 : 3;
  return shuffled.slice(0, numTags);
};

export function GroupedClassCard({ 
  groupedClass, 
  onAddToSchedule, 
  onRemoveFromSchedule,
  isAnyScheduled
}: GroupedClassCardProps) {
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>("")
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [professorRating, setProfessorRating] = React.useState<any>(null)
  const [loadingRating, setLoadingRating] = React.useState(false)
  
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
      setProfessorRating({
        name: selectedSection.instructor,
        rating: selectedSection.rating || 0,
        difficulty: selectedSection.difficulty || 0,
        wouldTakeAgain: selectedSection.wouldTakeAgain || 0,
        ratingDistribution: [0, 0, 0, 0, 0], // Not available in class API
        tags: [] // Not available in class API
      })
      setLoadingRating(false)
      return
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
        onRemoveFromSchedule(selectedSection.id)
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
      <div className="border rounded-md bg-card text-card-foreground hover:shadow-md transition-shadow px-2 py-1 mb-1">
          {/* Collapsed View */}
          <div className="space-y-2">
          {/* Class Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg font-mono font-semibold">
                  {groupedClass.subject} {groupedClass.number}
                </Badge>
                <div className="flex items-center gap-1">
                  {professorRating && professorRating.rating > 0 && (
                    <>
                      <Star className={`h-5 w-5 ${
                        professorRating.rating >= 4.0 
                          ? 'fill-green-500 text-green-500' 
                          : professorRating.rating >= 2.5 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'fill-red-500 text-red-500'
                      }`} />
                      <span className={`text-base font-medium ${
                        professorRating.rating >= 4.0 
                          ? 'text-green-600' 
                          : professorRating.rating >= 2.5 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>{professorRating.rating.toFixed(1)}</span>
                    </>
                  )}
                  <span className="text-lg text-muted-foreground font-medium">({selectedSection.instructor})</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight mt-2 truncate">
                {groupedClass.title}
              </h3>
              <div className="text-base text-muted-foreground mt-1.5 font-medium">
                {groupedClass.sections.length} section{groupedClass.sections.length > 1 ? 's' : ''} available  •  {groupedClass.credits || 3} credits
              </div>
            </div>
            
          </div>

          {/* Section Selection - always show */}
          <div className="flex items-start">
            <div className="flex-1 pr-2">
              {groupedClass.sections.length > 1 ? (
                <Select 
                  value={selectedSectionId || selectedSection.id} 
                  onValueChange={setSelectedSectionId}
                  disabled={isExpanded}
                >
                  <SelectTrigger className="h-12 text-sm" disabled={isExpanded}>
                    <div className="flex flex-col items-start w-full gap-1">
                      <span className="font-medium text-sm">{selectedSection.time}</span>
                      <span className="text-muted-foreground text-sm">{selectedSection.location}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {groupedClass.sections.map((section) => (
                      <SelectItem key={section.id} value={section.id} className="py-3">
                        <div className="flex flex-col items-start w-full gap-1">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm">{section.time}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {section.instructor} • {section.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className={`text-sm text-foreground h-12 flex flex-col justify-center ${isExpanded ? 'opacity-50' : ''}`}>
                  <div className="font-medium">{selectedSection.time}</div>
                  <div className="text-muted-foreground text-sm">{selectedSection.location}</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="group h-12 w-12"
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
                <TooltipContent className="dark px-2 py-1 text-xs">
                  Course Details
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="group h-12 w-12"
                    variant="outline"
                    size="icon"
                    onClick={handleAddToSchedule}
                    aria-expanded={isAnyScheduled}
                    aria-label={isAnyScheduled ? "Remove from schedule" : "Add to schedule"}
                  >
                    <Plus
                      className="transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] group-aria-expanded:rotate-[135deg]"
                      size={16}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="dark px-2 py-1 text-xs">
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

                {/* Rating metrics */}
                <div className="grid grid-cols-3 gap-6 pb-2">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Star className={`h-4 w-4 ${
                        professorRating?.rating >= 4.0 
                          ? 'fill-green-500 text-green-500' 
                          : professorRating?.rating >= 2.5 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'fill-red-500 text-red-500'
                      }`} />
                      <span className={`font-bold text-lg ${
                        professorRating?.rating >= 4.0 
                          ? 'text-green-600' 
                          : professorRating?.rating >= 2.5 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {loadingRating ? '...' : (professorRating?.rating?.toFixed(1) || 'N/A')}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="font-bold text-lg">
                        {loadingRating ? '...' : (professorRating?.difficulty?.toFixed(1) || 'N/A')}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm">Difficulty</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-lg">
                        {loadingRating ? '...' : `${Math.round(professorRating?.wouldTakeAgain || 0)}%`}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm">Would Take</div>
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

                {/* Student Comments */}
                <div className="flex flex-wrap gap-2 pb-2">
                  {loadingRating ? (
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      Loading tags...
                    </Badge>
                  ) : (professorRating?.tags || []).length > 0 ? (
                    (professorRating?.tags || []).slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-3 py-1.5"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No student tags available</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}