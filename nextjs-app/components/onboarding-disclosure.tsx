"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronLeft, ChevronRight, GraduationCap, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

interface Major {
  id: string
  name: string
  department: string
  college: string
}

interface OnboardingStep {
  title: string
  short_description: string
  full_description: string
}

interface OnboardingDisclosureProps {
  steps: OnboardingStep[]
  open: boolean
  setOpen: (open: boolean) => void
  onComplete: () => void
  onSkip: () => void
  selectedMajor: Major | null
  setSelectedMajor: (major: Major | null) => void
  graduationYear: string
  setGraduationYear: (year: string) => void
  majors: Major[]
}

export default function OnboardingDisclosure({
  steps,
  open,
  setOpen,
  onComplete,
  onSkip,
  selectedMajor,
  setSelectedMajor,
  graduationYear,
  setGraduationYear,
  majors,
}: OnboardingDisclosureProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dontShowAgain, setDontShowAgain] = React.useState(false)

  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true
      case 1: // Major selection
        return selectedMajor !== null
      case 2: // Graduation year
        return graduationYear !== ""
      case 3: // All set
        return true
      default:
        return false
    }
  }

  const progressValue = ((currentStep + 1) / steps.length) * 100

  const renderRightPanel = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-primary">Welcome to OU Class Manager</h2>
              <p className="text-muted-foreground max-w-md">
                Your personalized academic companion for degree tracking, schedule planning, and graduation success.
              </p>
            </div>
          </div>
        )

      case 1: // Major selection
        return (
          <div className="flex flex-col h-full p-6">
            <div className="space-y-4">
              <Label htmlFor="major-search" className="text-lg font-semibold">Search Majors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="major-search"
                  placeholder="Search by major name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {selectedMajor && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">Selected:</p>
                  <p className="font-semibold">{selectedMajor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMajor.department}</p>
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1 mt-4">
              <div className="space-y-2 pr-4">
                {filteredMajors.slice(0, 20).map((major) => (
                  <motion.div
                    key={major.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMajor(major)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedMajor?.id === major.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <div className="font-medium">{major.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {major.department} • {major.college}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )

      case 2: // Graduation year
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="space-y-6 w-full max-w-md">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Select Your Graduation Year</h3>
                <p className="text-muted-foreground">When do you expect to complete your degree?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <Button
                    key={year}
                    variant={graduationYear === year.toString() ? "default" : "outline"}
                    size="lg"
                    onClick={() => setGraduationYear(year.toString())}
                    className="h-16 text-lg"
                  >
                    {year}
                  </Button>
                ))}
              </div>
              
              {graduationYear && (
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">You'll graduate in</p>
                  <p className="text-2xl font-bold text-primary">{graduationYear}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 3: // All set
        return (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><span className="font-semibold">Major:</span> {selectedMajor?.name || "Not selected"}</p>
                <p><span className="font-semibold">Graduation:</span> {graduationYear || "Not selected"}</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[70vw] !max-w-[900px] h-[75vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 space-y-2 bg-muted border-b border-border">
          <DialogTitle>Welcome to OU Class Manager</DialogTitle>
          <Progress value={progressValue} className="h-1 mt-2" />
        </DialogHeader>

        <div className="grid grid-cols-2 h-full flex-1">
          {/* Left Panel - Steps */}
          <div className="p-8 pr-4 flex flex-col justify-center border-r">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg transition-all",
                    currentStep === index ? "bg-muted shadow-sm" : "",
                    index < currentStep ? "opacity-50" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    currentStep === index ? "bg-primary text-primary-foreground" : 
                    index < currentStep ? "bg-green-500 text-white" : "bg-muted-foreground/20"
                  )}>
                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold",
                      currentStep === index ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.short_description}</p>
                    {currentStep === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm mt-2"
                      >
                        {step.full_description}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                Skip all
              </Button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {currentStep === steps.length - 1 ? "Done" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>

            {/* Don't show again */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded"
                />
                Don't show this again
              </label>
            </div>
          </div>

          {/* Right Panel - Interactive Content */}
          <div className="bg-background">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderRightPanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}