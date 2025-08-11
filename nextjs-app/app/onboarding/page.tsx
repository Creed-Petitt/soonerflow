"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import HybridOnboarding from "@/components/hybrid-onboarding"
import LoadingScreen from "@/components/loading-screen"

interface Major {
  id: string
  name: string
  department: string
  college: string
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [majors, setMajors] = useState<Major[]>([])
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null)
  const [graduationYear, setGraduationYear] = useState<string>("")
  const [enrollmentYear, setEnrollmentYear] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch majors on component mount
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch("/api/majors")
        if (response.ok) {
          const data = await response.json()
          setMajors(data)
        }
      } catch (error) {
        console.error("Error fetching majors:", error)
      }
    }
    fetchMajors()
  }, [])

  const handleComplete = async () => {
    if (!session?.user?.githubId || !selectedMajor || !enrollmentYear || !graduationYear) {
      toast.error("Please complete all required fields")
      return
    }

    try {
      console.log('Attempting to save onboarding data:', {
        email: session.user.email,
        major: selectedMajor.name,
        enrollmentYear: parseInt(enrollmentYear),
        graduationYear: parseInt(graduationYear),
      });
      
      // Save all onboarding data including enrollment and graduation years
      const onboardingResponse = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email, // Use actual session email
          major: selectedMajor.name,
          enrollmentYear: parseInt(enrollmentYear),
          graduationYear: parseInt(graduationYear),
        }),
      });

      if (!onboardingResponse.ok) {
        const errorText = await onboardingResponse.text();
        console.error('Onboarding response error:', errorText);
        throw new Error("Failed to save onboarding data")
      }

      console.log('Onboarding data saved successfully');

      // Force session update to clear needsOnboarding flag
      await update()

      toast.success("Welcome to OU Class Manager!")
      
      // Force a page reload to ensure fresh session data
      window.location.href = "/dashboard"
      
    } catch (error) {
      console.error("Error completing onboarding:", error)
      console.error("Error details:", error instanceof Error ? error.message : error)
      toast.error("Failed to complete setup. Please try again.")
    }
  }

  const handleSkip = () => {
    // Allow skipping but redirect to sign out
    signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push("/")
    return null
  }

  const steps = [
    {
      title: "Choose Your Major",
      short_description: "Select your primary field of study", 
      full_description: `We have ${majors.length} majors available at OU. Your major determines your degree requirements, prerequisite chains, and graduation timeline. Choose the one that matches your academic program.`,
    },
    {
      title: "Academic Timeline",
      short_description: "When did you start and when will you finish?",
      full_description: "Tell us when you enrolled at OU and your expected graduation date. This helps us generate the right number of semesters for your degree plan, including past semesters where you may have already completed courses.",
    },
    {
      title: "You're All Set!",
      short_description: "Ready to continue your academic journey",
      full_description: `Perfect! You've selected ${selectedMajor?.name || 'your major'} with enrollment in ${enrollmentYear || 'your start year'} and expected graduation in ${graduationYear || 'your chosen year'}. Click "Done" to access your personalized dashboard with degree tracking, schedule planning, and academic progress monitoring.`,
    },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <HybridOnboarding
        steps={steps}
        open={open}
        setOpen={setOpen}
        onComplete={handleComplete}
        onSkip={handleSkip}
        selectedMajor={selectedMajor}
        setSelectedMajor={setSelectedMajor}
        graduationYear={graduationYear}
        setGraduationYear={setGraduationYear}
        enrollmentYear={enrollmentYear}
        setEnrollmentYear={setEnrollmentYear}
        majors={majors}
      />
    </div>
  )
}