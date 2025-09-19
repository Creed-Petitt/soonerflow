"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/api-client"

interface Major {
  id: string
  name: string
  department: string
  college: string
}

interface UserProfile {
  github_id: string
  email: string
  name: string
  avatar_url: string
  major: string | null
  created_at: string
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // User data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null)
  const [graduationYear, setGraduationYear] = useState<string>("")

  // Data from API
  const [majors, setMajors] = useState<Major[]>([])


  // Fetch user profile and majors simultaneously
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return
      
      try {
        // Fetch both majors and user profile in parallel
        const [majorsResponse, userResponse] = await Promise.all([
          fetch("/api/majors"),
          session.user.githubId 
            ? fetchWithAuth(`/api/users/${session.user.githubId}`)
            : null
        ])
        
        // Handle majors
        if (majorsResponse.ok) {
          const majorsData = await majorsResponse.json()
          setMajors(majorsData)
          
          // Handle user profile if available
          if (userResponse?.ok) {
            const userData = await userResponse.json()
            setUserProfile(userData)
            
            // Find current major
            if (userData.major) {
              const currentMajor = majorsData.find((m: Major) => m.name === userData.major)
              if (currentMajor) {
                setSelectedMajor(currentMajor)
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (status === "authenticated") {
      fetchData()
    }
  }, [session, status])


  const handleSave = async () => {
    if (!session?.user?.githubId || !selectedMajor) return

    setIsLoading(true)
    try {
      const response = await fetchWithAuth(`/api/users/${session.user.githubId}/major`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ major: selectedMajor.name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update major")
      }

      if (userProfile) {
        setUserProfile({ ...userProfile, major: selectedMajor.name })
      }

      await update()
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your profile and academic information</p>
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-lg font-medium mb-6">Account</h2>
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="text-lg">
                  {session.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{session.user.name}</p>
                <p className="text-muted-foreground">{session.user.email}</p>
                {userProfile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {new Date(userProfile.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium mb-6">Academic Information</h2>
      
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Major</label>
                <div className="mt-1">
                  {userProfile?.major ? (
                    <div className="flex items-center justify-between py-3 px-4 rounded-md border bg-muted/30">
                      <span className="font-medium">{userProfile.major}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                        className="text-xs h-8"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {}}
                      className="w-full justify-center h-12"
                    >
                      Select your major
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Choose Major</label>
                <Select
                  value={selectedMajor?.id || ""}
                  onValueChange={(value) => {
                    const major = majors.find(m => m.id === value)
                    setSelectedMajor(major || null)
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a major..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {majors.slice(0, 100).map((major) => (
                      <SelectItem key={major.id} value={major.id}>
                        <div>
                          <div className="font-medium">{major.name}</div>
                          <div className="text-xs text-muted-foreground">{major.department}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={!selectedMajor || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save Major"
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expected Graduation Year</label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select graduation year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}