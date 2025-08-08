"use client";

import { useState } from "react";
import CustomNavbar from "@/components/custom-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DegreeRequirementsTable from "@/components/degree-requirements-table";
import { ProgressRadialChart } from "@/components/progress-radial-chart";
import { AcademicProgressChart } from "@/components/academic-progress-chart";
import { 
  Sparkles, 
  X,
} from "lucide-react";

export default function DegreeProgressPage() {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [creditsCompleted] = useState(68);
  const totalCredits = 120;
  const [currentYear] = useState(2); // 2 = Sophomore (completed freshman year)

  return (
    <div className="min-h-screen bg-background">
      <CustomNavbar />
      
      <main className="px-3 py-2">
        {/* 3-Column Layout */}
        <div className="grid grid-cols-12 gap-x-2 items-start">
          
          {/* Left Column - Progress Overview (narrower) */}
          <div className="col-span-2 flex flex-col gap-2">
            {/* Progress Chart Card */}
            <div className="h-[200px]">
              <ProgressRadialChart 
                creditsCompleted={creditsCompleted}
                totalCredits={totalCredits}
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 -mt-20">
              <Card className="p-3 border flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">GPA</p>
                <p className="text-2xl font-bold">3.42</p>
              </Card>
              <Card className="p-3 border flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Major GPA</p>
                <p className="text-2xl font-bold">3.65</p>
              </Card>
            </div>

            {/* Graduation Status */}
            <div className="min-h-[142px]">
              <AcademicProgressChart 
                currentYear={currentYear}
                graduationDate="May 2027"
              />
            </div>

            {/* Action Buttons */}
            <Button className="w-full mb-2" variant="outline" size="sm">
              View Official Flowchart (PDF)
            </Button>
          </div>

          {/* Center Column - Requirements Table */}
          <div className="col-span-6 h-[430px] ml-2">
            <DegreeRequirementsTable />
          </div>

          {/* Right Column - AI Advisor (wider) */}
          {aiPanelOpen && (
            <div className="col-span-4">
              <Card className="p-3 h-[430px] border flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Advisor
                  </h3>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => setAiPanelOpen(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* AI Recommendations Placeholder */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                  >
                    Get Next Semester Plan
                  </Button>
                  
                  <div className="mt-4 p-3 bg-zinc-900/50 rounded text-xs">
                    <p className="text-zinc-500">
                      AI recommendations will appear here
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Section - Interactive Prerequisite Visualizer */}
        <div className="mt-2">
          <Card className="border">
            {/* Header with tabs for different views */}
            <div className="border-b p-2">
              <div className="flex items-center justify-between">
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
                  <Button size="sm" variant="outline">
                    Auto-Arrange
                  </Button>
                  <Button size="sm" variant="outline">
                    Save Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3 h-[400px] bg-muted/20">
              {plannerOpen ? (
                // Prerequisite Flow Visualizer (like the schema diagram)
                <div className="h-full border-2 border-dashed border-muted rounded flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-muted-foreground">
                      <p className="text-lg font-semibold">Interactive Prerequisite Flowchart</p>
                      <p className="text-sm">Will show course dependencies</p>
                    </div>
                    
                    {/* Mock visualization */}
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="p-3 bg-green-500/10 border border-green-600 rounded">
                        ECE 2214
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="p-3 bg-blue-500/10 border border-blue-600 rounded">
                        ECE 3723
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="p-3 bg-muted border border-muted-foreground/50 rounded">
                        ECE 4273
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Drag courses to plan semesters<br/>
                      Click for details • Red lines show missing prereqs
                    </p>
                  </div>
                </div>
              ) : (
                // Semester Grid View
                <div className="grid grid-cols-4 gap-2 h-full overflow-y-auto">
                  {["Fall 2024", "Spring 2025", "Fall 2025", "Spring 2026", 
                    "Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028"].map((sem) => (
                    <div key={sem} className="border rounded p-3 h-[150px]">
                      <p className="text-sm font-semibold mb-2 text-center">{sem}</p>
                      <div className="space-y-1">
                        {sem === "Fall 2024" && (
                          <>
                            <div className="text-sm p-2 bg-green-500/10 rounded text-center">ECE 2214</div>
                            <div className="text-sm p-2 bg-green-500/10 rounded text-center">MATH 2924</div>
                          </>
                        )}
                        {sem === "Spring 2025" && (
                          <div className="text-sm p-2 bg-blue-500/10 rounded text-center">ECE 3723</div>
                        )}
                        <div className="text-sm text-muted-foreground italic text-center">
                          Drop courses here
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}