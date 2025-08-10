"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronLeft, ChevronRight, GraduationCap, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { BackgroundLines } from "@/components/ui/background-lines"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"

interface Major {
  id: string
  name: string
  department: string
  college: string
}

interface OnboardingStep {
  title: string
  short_description: string
  full_description?: string
}

// Custom scrollable tracing beam component
const ScrollableTracingBeam = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = React.useState(0)
  
  React.useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const progress = scrollTop / (scrollHeight - clientHeight)
        setScrollProgress(progress)
      }
    }
    
    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  return (
    <div 
      ref={scrollRef}
      className="h-[400px] overflow-y-auto relative"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="relative">
        {/* Background line */}
        <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-800" />
        
        {/* Animated gradient line */}
        <motion.div
          className="absolute left-8 top-0 w-[2px] bg-gradient-to-b from-red-500 via-red-400 to-red-600"
          style={{
            height: `${scrollProgress * 100}%`,
            maxHeight: '100%'
          }}
        />
        
        {/* Animated dot at top */}
        <motion.div
          className="absolute left-[25px] w-4 h-4 rounded-full border-2 border-red-500 bg-white dark:bg-gray-900 shadow-lg z-10"
          style={{
            top: `${scrollProgress * 95}%`
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="pt-4 pl-16 pr-4">
          {children}
        </div>
      </div>
    </div>
  )
}

interface HybridOnboardingProps {
  steps: OnboardingStep[]
  open: boolean
  setOpen: (open: boolean) => void
  onComplete: () => void
  onSkip: () => void
  selectedMajor: Major | null
  setSelectedMajor: (major: Major | null) => void
  graduationYear: string
  setGraduationYear: (year: string) => void
  enrollmentYear: string
  setEnrollmentYear: (year: string) => void
  majors: Major[]
}

export default function HybridOnboarding({
  steps,
  open,
  setOpen,
  onComplete,
  onSkip,
  selectedMajor,
  setSelectedMajor,
  graduationYear,
  setGraduationYear,
  enrollmentYear,
  setEnrollmentYear,
  majors,
}: HybridOnboardingProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canComplete = () => {
    return selectedMajor !== null && enrollmentYear !== "" && graduationYear !== ""
  }

  const handleComplete = () => {
    if (canComplete()) {
      onComplete()
    }
  }


  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 !w-[70vw] !max-w-[900px] h-[85vh] p-0 gap-0 overflow-hidden bg-transparent border-0 shadow-none outline-none">
          <DialogTitle className="sr-only">Welcome to SoonerFlow - Onboarding</DialogTitle>
          <div className="flex flex-col h-full relative p-8">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="h-[200px] w-full flex items-center justify-center">
                <TextHoverEffect text="WELCOME" />
              </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="flex-1 grid grid-cols-2 gap-8 items-start">
              {/* Left Column - Major Selection */}
              <div className="flex flex-col h-full">
                <div className="space-y-3 mb-4">
                  <h3 className="text-xl font-semibold">Choose Your Major</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="major-search"
                      placeholder="Search by major name or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-transparent border-gray-800"
                    />
                  </div>
                </div>
                
                <div className="relative flex-1 min-h-[400px] max-h-[400px]">
                  <div 
                    className="h-full overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                    }}
                  >
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        width: 4px;
                      }
                      div::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      div::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.3);
                        border-radius: 20px;
                        border: none;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.5);
                      }
                    `}</style>
                    <div className="space-y-2 pb-8">
                      {filteredMajors.map((major) => (
                        <div
                          key={major.id}
                          onClick={() => setSelectedMajor(major)}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            selectedMajor?.id === major.id
                              ? "border-red-600"
                              : "border-gray-800 hover:border-gray-700"
                          )}
                        >
                          <div className="font-medium text-white">{major.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {major.department} • {major.college}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Fade-out gradient at bottom */}
                  <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right Column - Academic Timeline */}
              <div className="flex flex-col h-full min-h-[400px]">
                <div className="space-y-6 flex-1">
                  {/* Enrollment Year */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">When did you start at OU?</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[2019, 2020, 2021, 2022, 2023, 2024].map((year) => (
                        <button
                          key={`enroll-${year}`}
                          onClick={() => setEnrollmentYear(year.toString())}
                          className={cn(
                            "h-12 rounded-lg border font-medium transition-all",
                            enrollmentYear === year.toString()
                              ? "border-red-600 text-white"
                              : "border-gray-800 text-gray-300 hover:border-gray-700"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Graduation Year */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">When do you expect to graduate?</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                        <button
                          key={`grad-${year}`}
                          onClick={() => setGraduationYear(year.toString())}
                          className={cn(
                            "h-12 rounded-lg border font-medium transition-all",
                            graduationYear === year.toString()
                              ? "border-red-600 text-white"
                              : "border-gray-800 text-gray-300 hover:border-gray-700"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Summary */}
                  {enrollmentYear && graduationYear && (
                    <div className="mt-4 p-3 bg-gray-900/30 rounded-lg text-center">
                      <p className="text-sm text-gray-400">
                        {parseInt(graduationYear) - parseInt(enrollmentYear)} year journey
                        ({(parseInt(graduationYear) - parseInt(enrollmentYear)) * 2} regular semesters)
                      </p>
                    </div>
                  )}

                  {/* Confirmation Card */}
                  {canComplete() && (
                    <div className="mt-4 p-3 border border-gray-800 rounded">
                      <div className="text-center space-y-2">
                        <div className="text-xs text-gray-400">
                          {selectedMajor?.name} • {enrollmentYear}-{graduationYear}
                        </div>
                        
                        <button
                          onClick={handleComplete}
                          className="w-full px-3 py-1.5 border border-gray-800 hover:border-gray-700 text-white text-xs font-medium rounded transition-all"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}