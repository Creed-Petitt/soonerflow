"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PrerequisiteVisualizer from "@/components/prerequisite-flow/prerequisite-visualizer";
import useCourseStore from "@/stores/useCourseStore";
import {
  Search,
  Plus,
  BookOpen,
  ArrowLeft,
  Download,
  Settings,
  Trash2,
  X,
} from "lucide-react";

interface Course {
  id: number;
  code: string;
  title: string;
  credits: number;
  category: string;
  status: string;
}

export default function FlowchartPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  // Course store methods
  const flowChartNodes = useCourseStore((state) => state.flowChartNodes);
  const addToFlowChart = useCourseStore((state) => state.addToFlowChart);
  const removeFromFlowChart = useCourseStore((state) => state.removeFromFlowChart);
  const clearFlowChart = useCourseStore((state) => state.clearFlowChart);
  const exportFlowchartToScheduler = useCourseStore((state) => state.exportFlowchartToScheduler);
  const scheduledCourses = useCourseStore((state) => state.scheduledCourses);

  // Get courses currently in flowchart
  const flowchartCourses = useMemo(() => {
    return flowChartNodes.map(node => ({
      code: node.data.code,
      title: node.data.title,
      credits: node.data.credits || 3
    }));
  }, [flowChartNodes]);

  // Fetch available courses for search
  const fetchCourses = async (searchTerm: string = "") => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const url = `/api/courses/search?q=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search courses when search term changes
  useEffect(() => {
    if (showCourseSearch) {
      const debounceTimer = setTimeout(() => {
        fetchCourses(searchTerm);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, showCourseSearch, session?.user?.email]);

  // Filter out courses already in flowchart
  const searchResults = useMemo(() => {
    const flowchartCodes = new Set(flowchartCourses.map(c => c.code));
    return availableCourses.filter(course => !flowchartCodes.has(course.code));
  }, [availableCourses, flowchartCourses]);

  const handleAddCourse = (course: Course) => {
    addToFlowChart({
      code: course.code,
      title: course.title,
      credits: course.credits,
      category: course.category,
      status: course.status
    });
    setShowCourseSearch(false);
    setSearchTerm("");
  };

  const handleRemoveCourse = (courseCode: string) => {
    removeFromFlowChart(courseCode);
  };

  const handleExportToScheduler = () => {
    exportFlowchartToScheduler();
    // Show success feedback
    alert(`Exported ${flowchartCourses.length} courses to semester planner!`);
  };

  const totalCredits = flowchartCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <div className="min-h-screen bg-background">
      <CustomNavbar />
      
      <main className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Prerequisite Flowchart</h1>
              <p className="text-sm text-muted-foreground">
                Visualize course prerequisites and plan your academic path
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-medium">{flowchartCourses.length} courses</p>
              <p className="text-muted-foreground">{totalCredits} credits</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCourseSearch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToScheduler}
              disabled={flowchartCourses.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Scheduler
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFlowChart}
              disabled={flowchartCourses.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Main Flowchart */}
        <Card className="h-[calc(100vh-200px)] p-0 overflow-hidden">
          <PrerequisiteVisualizer />
        </Card>

        {/* Course Search Modal */}
        {showCourseSearch && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setShowCourseSearch(false)}
            />
            
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-background border rounded-lg shadow-xl z-50">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Add Course to Flowchart</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCourseSearch(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search courses (e.g. CS 2813, Calculus, Programming)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Searching courses...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y">
                      {searchResults.slice(0, 50).map((course) => (
                        <div 
                          key={course.id}
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleAddCourse(course)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">
                                  {course.code}
                                </span>
                                <span className="text-xs px-2 py-1 bg-muted/50 rounded">
                                  {course.credits} credits
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {course.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {course.category}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-muted-foreground">No courses found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Try different search terms
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Start typing to search courses</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Search by course code, title, or subject
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}