"use client"

import * as React from "react"
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverCloseButton,
} from "@/components/prismui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  User,
  Star,
  TrendingUp,
  MessageSquare,
  BookOpen,
  ThumbsUp,
  ArrowUpRight
} from "lucide-react"
import { RatingDistributionBarChart } from "@/components/rating-distribution-bar-chart"

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
  type?: string
}

interface ProfessorDetailsPopoverProps {
  instructor: string
  classData: ClassData
  children: React.ReactNode
}

// Mock professor data
const getMockProfessorData = (instructor: string) => {
  const mockData = {
    rating: 4.5,
    difficulty: 2.8,
    wouldTakeAgain: 97,
    numRatings: 110,
    department: "Electrical & Computer Engineering",
    tags: ["Clear lectures", "Helpful", "Fair grading", "Engaging", "Knowledgeable"],
    courses: ["ECE 2214", "ECE 3613", "ECE 4980"],
    ratingDistribution: {
      5: 104,
      4: 4,
      3: 2,
      2: 0,
      1: 0
    },
    recentComments: [
      {
        text: "Great professor, explains concepts clearly and is always willing to help during office hours.",
        semester: "Spring 2024",
        course: "ECE 2214"
      },
      {
        text: "Challenging but fair. You'll learn a lot if you put in the effort.",
        semester: "Fall 2023", 
        course: "ECE 3613"
      },
      {
        text: "Very knowledgeable and passionate about the subject. Highly recommend!",
        semester: "Spring 2023",
        course: "ECE 2214"
      }
    ]
  }
  
  return mockData
}

export function ProfessorDetailsPopover({
  instructor,
  classData,
  children
}: ProfessorDetailsPopoverProps) {
  const professorData = getMockProfessorData(instructor)
  
  // Generate initials from instructor name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <PopoverRoot>
      <PopoverTrigger variant="outline">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[400px]">
        <PopoverHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(instructor)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{instructor}</h3>
              <p className="text-sm text-muted-foreground">
                {professorData.department}
              </p>
            </div>
          </div>
        </PopoverHeader>
        
        <PopoverBody>
          {/* Rating Overview */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {professorData.rating.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Overall Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {professorData.difficulty.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Difficulty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {professorData.wouldTakeAgain}%
              </div>
              <div className="text-xs text-muted-foreground">Would Take</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <h4 className="text-sm font-medium">Rating Distribution</h4>
              <span className="text-xs text-muted-foreground">
                ({professorData.numRatings} ratings)
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(professorData.ratingDistribution)
                .reverse()
                .map(([stars, count]) => (
                  <div key={stars} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-xs">{stars}</span>
                      <Star className="h-3 w-3 text-yellow-500" />
                    </div>
                    <Progress 
                      value={(count / professorData.numRatings) * 100} 
                      className="h-2 flex-1" 
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Student Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4" />
              <h4 className="text-sm font-medium">Student Tags</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {professorData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Courses Taught */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" />
              <h4 className="text-sm font-medium">Courses Taught</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {professorData.courses.map((course, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {course}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Comments */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              <h4 className="text-sm font-medium">Recent Comments</h4>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {professorData.recentComments.map((comment, index) => (
                <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                  <p className="text-muted-foreground">"{comment.text}"</p>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{comment.course}</span>
                    <span>{comment.semester}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverBody>
        
        <PopoverFooter>
          <PopoverCloseButton />
          <Button size="sm" variant="outline">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            View Full Profile
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </PopoverRoot>
  )
}