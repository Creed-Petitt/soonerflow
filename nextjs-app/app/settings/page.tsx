"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, GraduationCap, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // User data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null)
  const [enrollmentYear, setEnrollmentYear] = useState<string>("")
  const [graduationYear, setGraduationYear] = useState<string>("")
  
  // Data from API
  const [majors, setMajors] = useState<Major[]>([])

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.githubId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/${session.user.githubId}`)
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data)
          
          // If user has a major, find it in the majors list
          if (data.major && majors.length > 0) {
            const currentMajor = majors.find(m => m.name === data.major)
            if (currentMajor) {
              setSelectedMajor(currentMajor)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [session, majors])

  // Fetch majors
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

  // Filter majors based on search
  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async () => {
    if (!session?.user?.githubId || !selectedMajor) return

    setIsSaving(true)
    try {
      // Update user's major
      const response = await fetch(`/api/users/${session.user.githubId}/major`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ major: selectedMajor.name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update major")
      }

      // Update local state
      if (userProfile) {
        setUserProfile({ ...userProfile, major: selectedMajor.name })
      }

      // Force session update
      await update()

      // Show success (could add a toast here)
      console.log("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your GitHub account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{session.user.name}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    GitHub ID: {session.user.githubId}
                  </p>
                </div>
              </div>
              {userProfile && (
                <div className="text-sm text-muted-foreground">
                  Member since {new Date(userProfile.created_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Update your major and graduation timeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Major Display */}
              {userProfile?.major && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Current Major</p>
                  <p className="text-lg">{userProfile.major}</p>
                </div>
              )}

              {/* Major Selection */}
              <div className="space-y-2">
                <Label htmlFor="major-search">Change Major</Label>
                <Input
                  id="major-search"
                  placeholder="Search for a major..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {filteredMajors.map((major) => (
                      <div
                        key={major.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedMajor?.id === major.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        )}
                        onClick={() => setSelectedMajor(major)}
                      >
                        <div className="font-medium">{major.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {major.department} • {major.college}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Graduation Year */}
              <div className="space-y-2">
                <Label htmlFor="graduation-year" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expected Graduation Year
                </Label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger id="graduation-year">
                    <SelectValue placeholder="Select year" />
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

              <Separator />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !selectedMajor || selectedMajor.name === userProfile?.major}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Additional settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                More settings will be available here in the future, including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Email notifications preferences</li>
                <li>• Course recommendation settings</li>
                <li>• Schedule visibility options</li>
                <li>• Data export and backup</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}