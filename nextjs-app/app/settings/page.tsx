"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Search, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [showMajorSearch, setShowMajorSearch] = useState(false)

  // User data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null)
  const [graduationYear, setGraduationYear] = useState<string>("")

  // Data from API
  const [majors, setMajors] = useState<Major[]>([])

  // Get auth provider type
  const getAuthProvider = () => {
    if (session?.user?.githubId) return "GitHub"
    if ((session?.user as any)?.googleId) return "Google"
    return "Account"
  }

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

  // Filter majors based on search
  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      setShowMajorSearch(false)
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
        {/* Header */}
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
          {/* Profile Section */}
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

          {/* Academic Information */}
          <div>
            <h2 className="text-lg font-medium mb-6">Academic Information</h2>
            
            {/* Current Major */}
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
                        onClick={() => setShowMajorSearch(!showMajorSearch)}
                        className="text-xs h-8"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowMajorSearch(true)}
                      className="w-full justify-center h-12"
                    >
                      Select your major
                    </Button>
                  )}
                </div>
              </div>

              {/* Major Search */}
              {showMajorSearch && (
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for a major..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {filteredMajors.slice(0, 50).map((major) => (
                      <div
                        key={major.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
                          selectedMajor?.id === major.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedMajor(major)}
                      >
                        <div>
                          <div className="font-medium text-sm">{major.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {major.department}
                          </div>
                        </div>
                        {selectedMajor?.id === major.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowMajorSearch(false)
                        setSearchQuery("")
                        setSelectedMajor(userProfile?.major ? majors.find(m => m.name === userProfile.major) || null : null)
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isLoading || !selectedMajor}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Graduation Year */}
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