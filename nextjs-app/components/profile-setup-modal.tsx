"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { fetchWithAuth } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface Major {
  id: string
  name: string
  department: string
  college: string
}

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
  const { data: session } = useSession()
  const [majors, setMajors] = useState<Major[]>([])
  const [selectedMajor, setSelectedMajor] = useState("")
  const [enrollmentYear, setEnrollmentYear] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch majors on mount
  useEffect(() => {
    const fetchMajors = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/majors")
        if (response.ok) {
          const data = await response.json()
          setMajors(data)
        }
      } catch (error) {
        console.error("Error fetching majors:", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (isOpen) {
      fetchMajors()
    }
  }, [isOpen])

  const generateEnrollmentYears = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    // Allow selection from 5 years ago to current year
    for (let year = currentYear - 5; year <= currentYear; year++) {
      years.push(`Fall ${year}`)
      if (year < currentYear) {
        years.push(`Spring ${year + 1}`)
      }
    }
    return years.reverse()
  }

  const generateGraduationYears = () => {
    if (!enrollmentYear) return []
    
    const enrollYear = parseInt(enrollmentYear.split(' ')[1])
    const years = []
    
    // Generate 3-6 years from enrollment
    for (let year = enrollYear + 2; year <= enrollYear + 6; year++) {
      years.push(`Spring ${year}`)
      years.push(`Fall ${year}`)
    }
    
    return years
  }

  const handleSave = async () => {
    if (!selectedMajor || !enrollmentYear || !graduationYear || !session?.user?.githubId) {
      return
    }

    setIsLoading(true)
    try {
      const selectedMajorData = majors.find(m => m.id === selectedMajor)
      const enrollYear = parseInt(enrollmentYear.split(' ')[1])
      const gradYear = parseInt(graduationYear.split(' ')[1])

      const response = await fetchWithAuth(`/api/users/${session.user.githubId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: selectedMajorData?.name,
          enrollment_year: enrollYear,
          graduation_year: gradYear,
        }),
      })

      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        console.error("Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to SoonerFlow! 🎓</DialogTitle>
          <DialogDescription className="text-base">
            Let's set up your academic profile. This helps us provide personalized course recommendations and track your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Major Selection */}
          <div className="grid gap-2">
            <Label htmlFor="major">Your Major *</Label>
            <Select value={selectedMajor} onValueChange={setSelectedMajor} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your major..." />
              </SelectTrigger>
              <SelectContent>
                {majors.map((major) => (
                  <SelectItem 
                    key={major.id} 
                    value={major.id}
                    className=""
                  >
                    {major.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enrollment Year */}
          <div className="grid gap-2">
            <Label htmlFor="enrollment">When did you start at OU? *</Label>
            <Select 
              value={enrollmentYear} 
              onValueChange={(value) => {
                setEnrollmentYear(value)
                setGraduationYear("") // Reset graduation when enrollment changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select start semester..." />
              </SelectTrigger>
              <SelectContent>
                {generateEnrollmentYears().map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year}
                    className=""
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Graduation Year */}
          <div className="grid gap-2">
            <Label htmlFor="graduation">When do you plan to graduate? *</Label>
            <Select 
              value={graduationYear} 
              onValueChange={setGraduationYear}
              disabled={!enrollmentYear}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={enrollmentYear ? "Select graduation semester..." : "Select enrollment year first"} />
              </SelectTrigger>
              <SelectContent>
                {generateGraduationYears().map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year}
                    className=""
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={!selectedMajor || !enrollmentYear || !graduationYear || isLoading}
            size="lg"
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}