"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DegreeRequirementsTable from "@/components/degree-requirements-table";
import { ProgressRadialChart } from "@/components/progress-radial-chart";
import { AcademicProgressChart } from "@/components/academic-progress-chart";
import { 
  TextRevealCard,
  TextRevealCardDescription,
  TextRevealCardTitle,
} from "@/components/ui/text-reveal-card";
import PrerequisiteVisualizer from "@/components/prerequisite-flow/prerequisite-visualizer";
import { generateStudentSemesters, type Semester } from "@/lib/semester-utils";
import { 
  Sparkles, 
  X,
  Expand,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [flowFullscreen, setFlowFullscreen] = useState(false);
  const [creditsCompleted] = useState(68);
  const totalCredits = 120;
  const [currentYear] = useState(2); // 2 = Sophomore (completed freshman year)
  
  // Dynamic semester generation
  const [enrollmentYear, setEnrollmentYear] = useState(2020); // Default, will be updated from user data
  const [graduationYear, setGraduationYear] = useState(2027); // Default, will be updated from user data
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [additionalSemesters, setAdditionalSemesters] = useState(0); // For adding extra semesters if needed
  
  // Generate semesters based on enrollment and graduation years
  useEffect(() => {
    // TODO: Fetch actual enrollment and graduation years from user data once we update the model
    // For now, using defaults that would work for someone graduating in 2027 who started in 2020
    const generatedSemesters = generateStudentSemesters(
      enrollmentYear, 
      graduationYear + additionalSemesters,
      false // Don't include summer by default
    );
    setSemesters(generatedSemesters);
  }, [enrollmentYear, graduationYear, additionalSemesters]);

  return (
    <div className="min-h-screen bg-background">
      <CustomNavbar />
      
      <main className="px-6 py-4">
        {/* Main Layout - Now 3-9 split */}
        <div className="grid grid-cols-12 gap-x-4 items-start">
          
          {/* Left Column - Progress Overview (wider) */}
          <div className="col-span-3 flex flex-col gap-3">
            {/* Progress Chart Card */}
            <div className="h-[200px]">
              <ProgressRadialChart 
                creditsCompleted={creditsCompleted}
                totalCredits={totalCredits}
              />
            </div>

            {/* GPA Display with Text Reveal Effect */}
            <div className="flex justify-center -mt-[55px] -ml-[3px]">
              <TextRevealCard
                text="GPA"
                revealText="3.42"
                className="w-[150px]"
              />
            </div>

            {/* Graduation Status */}
            <div className="min-h-[160px]">
              <AcademicProgressChart 
                currentYear={currentYear}
                graduationDate="May 2027"
              />
            </div>

            {/* Action Buttons */}
            <Button className="w-full" variant="outline" size="sm">
              View Official Flowchart (PDF)
            </Button>
          </div>

          {/* Center Column - Requirements Table (much wider) */}
          <div className="col-span-9 h-[455px]">
            <DegreeRequirementsTable />
          </div>
        </div>

        {/* Floating Action Button for AI Advisor */}
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          onClick={() => setAiDrawerOpen(true)}
        >
          <Sparkles className="h-6 w-6" />
        </Button>

        {/* AI Advisor Slide-out Drawer */}
        {aiDrawerOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setAiDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[450px] bg-background border-l shadow-xl z-50 transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Advisor
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setAiDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Get Next Semester Plan
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Analyze Graduation Progress
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Suggest Electives
                    </Button>
                    
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">AI Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Click any of the buttons above to get personalized recommendations based on your degree progress and course history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom Section - Interactive Prerequisite Visualizer */}
        <div className="mt-3">
          <Card className="border p-0">
            {/* Header with tabs for different views */}
            <div className="flex items-center justify-between border-b px-2 py-1">
              <div className="flex gap-2">
                <Button 
                  variant={plannerOpen ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setPlannerOpen(true)}
                >
                  Prerequisite Flow
                </Button>
                <Button 
                  variant={!plannerOpen ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setPlannerOpen(false)}
                >
                  Semester Grid
                </Button>
              </div>
              <div className="flex gap-2">
                {plannerOpen && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setFlowFullscreen(true)}
                  >
                    <Expand className="h-3 w-3 mr-1" />
                    Fullscreen
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  Save Plan
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3 h-[400px] bg-muted/20">
              {plannerOpen ? (
                // Prerequisite Flow Visualizer
                <div className="h-full rounded overflow-hidden">
                  <PrerequisiteVisualizer />
                </div>
              ) : (
                // Semester Grid View
                <div className="h-full flex flex-col">
                  <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto">
                    {semesters.map((semester) => (
                      <div key={semester.value} className="border rounded p-3 h-[150px]">
                        <p className="text-sm font-semibold mb-2 text-center">{semester.label}</p>
                        <div className="space-y-1">
                          {/* Example classes - will be replaced with actual data */}
                          {semester.value === "Fall 2024" && (
                            <>
                              <div className="text-sm p-2 bg-green-500/10 rounded text-center">ECE 2214</div>
                              <div className="text-sm p-2 bg-green-500/10 rounded text-center">MATH 2924</div>
                            </>
                          )}
                          {semester.value === "Spring 2025" && (
                            <div className="text-sm p-2 bg-blue-500/10 rounded text-center">ECE 3723</div>
                          )}
                          <div className="text-sm text-muted-foreground italic text-center text-xs">
                            Drop courses here
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Semester Button */}
                  <div className="mt-2 flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdditionalSemesters(prev => prev + 1)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Semester
                    </Button>
                    {additionalSemesters > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdditionalSemesters(0)}
                        className="ml-2 text-xs text-muted-foreground"
                      >
                        Reset to {graduationYear}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Fullscreen Prerequisite Flow Modal */}
        {flowFullscreen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-background z-50">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-b z-10 flex items-center justify-between px-6">
                <h2 className="text-lg font-semibold">Interactive Prerequisite Flowchart</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFlowFullscreen(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close Fullscreen
                </Button>
              </div>
              
              {/* Full screen flow visualizer */}
              <div className="absolute inset-0 top-16">
                <PrerequisiteVisualizer />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}