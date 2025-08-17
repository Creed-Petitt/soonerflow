"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { useSession } from "next-auth/react"

interface GPACalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SimulatedCourse {
  id: string
  name: string
  credits: number
  grade: string
}

export function GPACalculatorModal({ isOpen, onClose }: GPACalculatorModalProps) {
  const { data: session } = useSession()
  const [currentGPA, setCurrentGPA] = useState(0)
  const [currentCredits, setCurrentCredits] = useState(0)
  const [simulatedCourses, setSimulatedCourses] = useState<SimulatedCourse[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load current GPA when modal opens
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      loadCurrentGPA()
    }
  }, [isOpen, session?.user?.email])
  
  const loadCurrentGPA = async () => {
    try {
      const response = await fetch(`/api/user/dashboard?user_email=${encodeURIComponent(session?.user?.email || "")}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentGPA(data.gpa || 0)
        setCurrentCredits(data.creditsCompleted || 0)
      }
    } catch (error) {
      console.error("Failed to load GPA:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const addCourse = () => {
    const newCourse: SimulatedCourse = {
      id: Date.now().toString(),
      name: "",
      credits: 3,
      grade: "A"
    }
    setSimulatedCourses([...simulatedCourses, newCourse])
  }
  
  const removeCourse = (id: string) => {
    setSimulatedCourses(simulatedCourses.filter(c => c.id !== id))
  }
  
  const updateCourse = (id: string, field: keyof SimulatedCourse, value: any) => {
    setSimulatedCourses(simulatedCourses.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }
  
  const calculateNewGPA = () => {
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    }
    
    // Current total grade points
    const currentTotalPoints = currentGPA * currentCredits
    
    // New courses grade points
    const newPoints = simulatedCourses.reduce((sum, course) => {
      return sum + (gradePoints[course.grade] * course.credits)
    }, 0)
    
    const newCredits = simulatedCourses.reduce((sum, course) => sum + course.credits, 0)
    
    const totalPoints = currentTotalPoints + newPoints
    const totalCredits = currentCredits + newCredits
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(3) : "0.000"
  }
  
  const newGPA = parseFloat(calculateNewGPA())
  const gpaChange = newGPA - currentGPA
  const isImprovement = gpaChange > 0
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            GPA Calculator
          </DialogTitle>
          <DialogDescription>
            Simulate how potential grades will affect your cumulative GPA
          </DialogDescription>
        </DialogHeader>
        
        {!loading && (
          <div className="space-y-6">
            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current GPA</p>
                <p className="text-2xl font-bold">{currentGPA.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Completed</p>
                <p className="text-2xl font-bold">{currentCredits}</p>
              </div>
            </div>
            
            {/* Simulated Courses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Add Hypothetical Courses</h3>
                <Button size="sm" onClick={addCourse}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Course
                </Button>
              </div>
              
              {simulatedCourses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Add courses to see how they'll affect your GPA
                </div>
              ) : (
                <div className="space-y-2">
                  {simulatedCourses.map(course => (
                    <div key={course.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Course name (optional)"
                        value={course.name}
                        onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        max="6"
                        value={course.credits}
                        onChange={(e) => updateCourse(course.id, 'credits', parseInt(e.target.value) || 3)}
                        className="w-20"
                      />
                      <Select 
                        value={course.grade}
                        onValueChange={(value) => updateCourse(course.id, 'grade', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A (4.0)</SelectItem>
                          <SelectItem value="B">B (3.0)</SelectItem>
                          <SelectItem value="C">C (2.0)</SelectItem>
                          <SelectItem value="D">D (1.0)</SelectItem>
                          <SelectItem value="F">F (0.0)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Results */}
            {simulatedCourses.length > 0 && (
              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="font-medium">Projected Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">New Cumulative GPA</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {newGPA.toFixed(3)}
                      {gpaChange !== 0 && (
                        <span className={`text-sm flex items-center ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                          {isImprovement ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {gpaChange > 0 ? '+' : ''}{gpaChange.toFixed(3)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-2xl font-bold">
                      {currentCredits + simulatedCourses.reduce((sum, c) => sum + c.credits, 0)}
                    </p>
                  </div>
                </div>
                
                {/* GPA Status Messages */}
                <div className="text-sm">
                  {newGPA >= 3.5 && (
                    <p className="text-green-600">Dean's List eligible (3.5+ GPA)</p>
                  )}
                  {newGPA >= 3.0 && newGPA < 3.5 && (
                    <p className="text-blue-600">Good academic standing</p>
                  )}
                  {newGPA < 2.0 && (
                    <p className="text-red-600">Warning: Below 2.0 minimum GPA requirement</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}