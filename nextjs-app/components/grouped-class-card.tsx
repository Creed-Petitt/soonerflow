"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Plus, ChevronDown, Clock, MapPin, Users, TrendingUp, Award, BookOpen } from "lucide-react"
import { ExpandableClassCard } from "@/components/expandable-class-card"
import { RatingDistributionChart } from "@/components/rating-distribution-chart"
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
    const loadProfessorRating = async () => {
      if (!selectedSection.instructor || selectedSection.instructor.toLowerCase().includes('tba')) {
        setProfessorRating(null)
        return
      }

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
  }, [selectedSection.instructor])

  const handleAddToSchedule = () => {
    if (selectedSection) {
      onAddToSchedule(selectedSection)
    }
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="border rounded-md bg-card text-card-foreground hover:shadow-md transition-shadow px-2 py-1">
        {/* Collapsed View */}
        <div className="space-y-1">
          {/* Class Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-mono">
                  {groupedClass.subject} {groupedClass.number}
                </Badge>
                {professorRating && professorRating.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{professorRating.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({selectedSection.instructor})</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-tight mt-1 truncate">
                {groupedClass.title}
              </h3>
              <div className="text-xs text-muted-foreground mt-1 font-medium">
                {groupedClass.sections.length} section{groupedClass.sections.length > 1 ? 's' : ''} available • {groupedClass.credits || 3} credits
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                className="group h-8 px-3"
                variant="outline"
                onClick={handleAddToSchedule}
                disabled={isAnyScheduled}
                aria-expanded={isAnyScheduled}
                aria-label={isAnyScheduled ? "Added to schedule" : "Add to schedule"}
              >
                <Plus
                  className="h-4 w-4 mr-2 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] group-aria-expanded:rotate-[135deg]"
                  aria-hidden="true"
                />
                <span className="text-xs">{isAnyScheduled ? 'Added' : 'Add'}</span>
              </Button>
              <Button
                className="group h-8 px-3"
                variant="outline"
                onClick={handleToggleExpanded}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Hide details" : "Show details"}
              >
                <svg
                  className="pointer-events-none h-4 w-4 mr-2"
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
                <span className="text-xs">{isExpanded ? 'Less' : 'Details'}</span>
              </Button>
            </div>
          </div>

          {/* Section Selection - only show when collapsed */}
          {!isExpanded && (
            <div className="space-y-2">
              {groupedClass.sections.length > 1 ? (
                <Select value={selectedSectionId || selectedSection.id} onValueChange={setSelectedSectionId}>
                  <SelectTrigger className="h-12 text-sm">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {groupedClass.sections.map((section) => (
                      <SelectItem key={section.id} value={section.id} className="py-3">
                        <div className="flex flex-col items-start w-full gap-1">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm">{section.time}</span>
                            {section.rating && section.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{section.rating.toFixed(1)}</span>
                              </div>
                            )}
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
                <div className="text-sm text-foreground">
                  <div className="font-medium">{selectedSection.time}</div>
                  <div className="text-muted-foreground text-sm">{selectedSection.instructor}</div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Expanded View - show the beautiful detailed view directly */}
        {isExpanded && selectedSection && (
          <div className="mt-6 pt-4 border-t border-border space-y-4">
            {/* Full class title */}
            <div>
              <h4 className="font-semibold text-base leading-tight">
                {selectedSection.title}
              </h4>
            </div>

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
                  <span className="text-base font-semibold">
                    {selectedSection.instructor}
                  </span>
                  {loadingRating && (
                    <span className="text-xs text-muted-foreground">Loading ratings...</span>
                  )}
                </div>

                {/* Rating metrics */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">
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
                <div className="space-y-3">
                  <div className="text-base font-semibold">Rating Distribution</div>
                  <RatingDistributionChart 
                    ratingDistribution={professorRating?.ratingDistribution || [0, 0, 0, 0, 0]}
                    className="w-full"
                  />
                </div>

                {/* Student Comments */}
                <div className="space-y-3">
                  <div className="text-base font-semibold">Student Comments</div>
                  <div className="flex flex-wrap gap-2">
                    {loadingRating ? (
                      <Badge variant="secondary" className="text-sm px-3 py-1.5">
                        Loading tags...
                      </Badge>
                    ) : (professorRating?.tags || []).length > 0 ? (
                      (professorRating?.tags || []).slice(0, 4).map((tag, index) => (
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
              </div>
            )}
          </div>
        )}
    </div>
  )
}