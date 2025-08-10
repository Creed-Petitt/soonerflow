"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Star, 
  AlertCircle,
  CheckCircle,
  Calendar,
  BookOpen,
  GraduationCap,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { LabSelectionModal } from "@/components/lab-selection-modal"
import useCourseStore from "@/stores/useCourseStore"
import { useSchedule } from "@/hooks/use-schedule"

interface ClassSection {
  id: string
  subject: string
  courseNumber: string
  title: string
  instructor: string
  time: string
  location: string
  credits: number
  availableSeats: number
  totalSeats: number
  type?: string
}

interface ProfessorData {
  firstName: string
  lastName: string
  avgRating: number
  avgDifficulty: number
  wouldTakeAgainPercent: number
  numRatings: number
  department: string
}

interface CourseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: string
    code: string
    name: string
    credits: number
    prerequisite?: string
    category?: string
  }
  onAddToSchedule: (section: ClassSection, labSection?: ClassSection) => void
}

export function CourseDetailModal({ 
  isOpen, 
  onClose, 
  course,
  onAddToSchedule 
}: CourseDetailModalProps) {
  const [selectedSection, setSelectedSection] = useState<ClassSection | null>(null)
  const [sections, setSections] = useState<ClassSection[]>([])
  const [labSections, setLabSections] = useState<ClassSection[]>([])
  const [professors, setProfessors] = useState<Map<string, ProfessorData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [labModalOpen, setLabModalOpen] = useState(false)
  
  // Get scheduled courses to check for conflicts
  const scheduledCourses = useCourseStore((state) => state.scheduledCourses)
  const addToSchedule = useCourseStore((state) => state.addToSchedule)
  const { isAuthenticated } = useSchedule()

  // Load course sections and professor data
  useEffect(() => {
    if (!isOpen || !course) return
    
    const loadCourseData = async () => {
      setLoading(true)
      try {
        // Parse course code (e.g., "ECE 2214" -> subject: "ECE", number: "2214")
        const [subject, number] = course.code.split(' ')
        
        // Fetch all sections for this course
        const response = await fetch(`/api/classes?subject=${subject}&limit=500`)
        if (response.ok) {
          const data = await response.json()
          const allSections = data.classes || []
          
          // Filter for this specific course
          const courseSections = allSections.filter((s: any) => 
            s.subject === subject && s.courseNumber === number
          )
          
          // Separate lecture and lab sections
          const lectures = courseSections.filter((s: any) => s.type !== 'Lab with No Credit')
          const labs = courseSections.filter((s: any) => s.type === 'Lab with No Credit')
          
          setSections(lectures)
          setLabSections(labs)
          
          // Select first available section by default
          if (lectures.length > 0) {
            setSelectedSection(lectures[0])
          }
          
          // Load professor data for each unique instructor
          const instructorNames = new Set(courseSections.map((s: any) => s.instructor).filter(Boolean))
          const profData = new Map<string, ProfessorData>()
          
          for (const instructorName of instructorNames) {
            try {
              // Parse instructor name (Last, First -> First Last)
              const nameParts = instructorName.split(',').map((p: string) => p.trim())
              const searchName = nameParts.length > 1 ? 
                `${nameParts[1]} ${nameParts[0]}` : instructorName
              
              const profResponse = await fetch(`/api/professors/search?name=${encodeURIComponent(searchName)}`)
              if (profResponse.ok) {
                const prof = await profResponse.json()
                if (prof && prof.id) {
                  profData.set(instructorName, prof)
                }
              }
            } catch (error) {
              console.error(`Error loading professor data for ${instructorName}:`, error)
            }
          }
          
          setProfessors(profData)
        }
      } catch (error) {
        console.error('Error loading course data:', error)
      }
      setLoading(false)
    }
    
    loadCourseData()
  }, [isOpen, course])

  // Check for time conflicts
  const checkTimeConflict = (section: ClassSection): boolean => {
    if (!section.time || section.time === 'TBA') return false
    
    for (const [_, scheduledCourse] of scheduledCourses) {
      if (!scheduledCourse.time || scheduledCourse.time === 'TBA') continue
      
      // Parse times and check for overlap
      // This is simplified - you'd need the full conflict detection logic
      if (section.time === scheduledCourse.time) {
        return true
      }
    }
    
    return false
  }

  const handleAddToSchedule = () => {
    if (!selectedSection) return
    
    // Check if this course requires a lab
    if (labSections.length > 0) {
      setLabModalOpen(true)
    } else {
      // No lab required, add directly
      onAddToSchedule(selectedSection)
      onClose()
    }
  }

  const handleLabSelection = (labSection: ClassSection) => {
    if (selectedSection) {
      onAddToSchedule(selectedSection, labSection)
      onClose()
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-green-600"
    if (difficulty <= 3.5) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl font-bold">{course.code}</span>
              <Badge variant="secondary">{course.credits} credits</Badge>
              {course.category && (
                <Badge variant="outline">{course.category}</Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              {course.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="sections" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="professors">Professors</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading sections...
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No sections available for this course
                    </div>
                  ) : (
                    sections.map((section) => {
                      const hasConflict = checkTimeConflict(section)
                      const professor = professors.get(section.instructor)
                      const isFull = section.availableSeats === 0
                      
                      return (
                        <Card
                          key={section.id}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedSection?.id === section.id
                              ? 'ring-2 ring-primary'
                              : 'hover:shadow-md'
                          } ${hasConflict ? 'opacity-60' : ''} ${isFull ? 'opacity-50' : ''}`}
                          onClick={() => !hasConflict && !isFull && setSelectedSection(section)}
                        >
                          <div className="space-y-2">
                            {/* Section header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant={isFull ? "destructive" : "secondary"}>
                                  Section {section.id.slice(-3)}
                                </Badge>
                                {hasConflict && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Time Conflict
                                  </Badge>
                                )}
                                {selectedSection?.id === section.id && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {section.availableSeats}/{section.totalSeats} seats
                              </div>
                            </div>

                            {/* Section details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span>{section.time || 'TBA'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span>{section.location || 'TBA'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{section.instructor || 'TBA'}</span>
                                </div>
                                {professor && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Star className="h-3 w-3 text-muted-foreground" />
                                    <span className={getRatingColor(professor.avgRating)}>
                                      {professor.avgRating.toFixed(1)}/5.0
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({professor.numRatings} ratings)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 p-1">
                  {course.prerequisite && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                      <p className="text-sm text-muted-foreground">{course.prerequisite}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Course Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {/* This would come from the API */}
                      This course covers fundamental concepts and practical applications in the field.
                      Students will gain hands-on experience through projects and assignments.
                    </p>
                  </div>

                  {labSections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Lab Requirement
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        This course requires enrollment in a lab section. You will be prompted to select a lab
                        section after choosing your lecture section.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="professors" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {Array.from(professors.entries()).map(([name, prof]) => (
                    <Card key={name} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{prof.firstName} {prof.lastName}</h4>
                          <p className="text-sm text-muted-foreground">{prof.department}</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Overall Rating</span>
                            </div>
                            <p className={`text-xl font-bold ${getRatingColor(prof.avgRating)}`}>
                              {prof.avgRating.toFixed(1)}/5.0
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {prof.numRatings} ratings
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Difficulty</span>
                            </div>
                            <p className={`text-xl font-bold ${getDifficultyColor(prof.avgDifficulty)}`}>
                              {prof.avgDifficulty.toFixed(1)}/5.0
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {prof.avgDifficulty <= 2 ? 'Easy' : 
                               prof.avgDifficulty <= 3.5 ? 'Moderate' : 'Hard'}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Would Take Again</span>
                            </div>
                            <p className="text-xl font-bold text-primary">
                              {prof.wouldTakeAgainPercent}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              of students
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {professors.size === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No professor ratings available for this course
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedSection && (
                <span>
                  Selected: Section {selectedSection.id.slice(-3)} with {selectedSection.instructor}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddToSchedule}
                disabled={!selectedSection || loading}
              >
                Add to Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Selection Modal */}
      {selectedSection && (
        <LabSelectionModal
          isOpen={labModalOpen}
          onClose={() => setLabModalOpen(false)}
          onSelectLab={(_, labSection) => handleLabSelection(labSection as ClassSection)}
          lectureSection={selectedSection as any}
          labSections={labSections as any}
          scheduledClasses={Array.from(scheduledCourses.values()) as any}
        />
      )}
    </>
  )
}