"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Node } from "@xyflow/react";
import { CourseNodeData } from "./course-node";
import useFlowchartStore from "@/stores/useFlowchartStore";
import { toast } from "sonner";
import {
  Calendar,
  GraduationCap,
  BookOpen,
  Search,
  Plus,
  Loader2,
} from "lucide-react";

interface QuickAddPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddPanel({ isOpen, onClose }: QuickAddPanelProps) {
  const { data: session } = useSession();
  const addNode = useFlowchartStore((state) => state.addNode);
  const nodes = useFlowchartStore((state) => state.nodes);
  
  // State for different add methods
  const [selectedSemester, setSelectedSemester] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  // Fetch available semesters on mount
  useEffect(() => {
    fetchSemesters();
  }, []);
  
  const fetchSemesters = async () => {
    try {
      const response = await fetch("/api/flowchart/available-semesters");
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.semesters);
        if (data.semesters.length > 0) {
          setSelectedSemester(data.semesters[0].code);
        }
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };
  
  // Add courses from a semester
  const handleAddFromSemester = async () => {
    if (!session?.user?.githubId || !selectedSemester) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/flowchart/semester-courses/${session.user.githubId}/${selectedSemester}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || [];
        
        // Filter out courses already in flowchart
        const existingCodes = new Set(nodes.map(n => n.id));
        const newCourses = courses.filter((c: any) => !existingCodes.has(c.code.replace(' ', '').toLowerCase()));
        
        // Add each course as a node
        newCourses.forEach((course: any, index: number) => {
          const node: Node<CourseNodeData> = {
            id: course.code.replace(' ', '').toLowerCase(),
            type: "courseNode",
            position: {
              x: 100 + (index % 5) * 200,
              y: 100 + Math.floor(index / 5) * 150,
            },
            data: {
              code: course.code,
              name: course.title,
              credits: course.credits || 3,
              status: course.status === "completed" ? "completed" : "in-progress",
            },
          };
          addNode(node);
        });
        
        toast.success(`Added ${newCourses.length} courses from semester`);
        onClose();
      }
    } catch (error) {
      console.error("Error adding semester courses:", error);
      toast.error("Failed to add semester courses");
    } finally {
      setLoading(false);
    }
  };
  
  // Add all completed courses
  const handleAddAllCompleted = async () => {
    if (!session?.user?.githubId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/flowchart/completed-courses/${session.user.githubId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || [];
        
        // Filter out courses already in flowchart
        const existingCodes = new Set(nodes.map(n => n.id));
        const newCourses = courses.filter((c: any) => !existingCodes.has(c.code.replace(' ', '').toLowerCase()));
        
        // Add each course as a node
        newCourses.forEach((course: any, index: number) => {
          const node: Node<CourseNodeData> = {
            id: course.code.replace(' ', '').toLowerCase(),
            type: "courseNode",
            position: {
              x: 100 + (index % 5) * 200,
              y: 100 + Math.floor(index / 5) * 150,
            },
            data: {
              code: course.code,
              name: course.title,
              credits: course.credits || 3,
              status: "completed",
            },
          };
          addNode(node);
        });
        
        toast.success(`Added ${newCourses.length} completed courses`);
        onClose();
      }
    } catch (error) {
      console.error("Error adding completed courses:", error);
      toast.error("Failed to add completed courses");
    } finally {
      setLoading(false);
    }
  };
  
  // Add all major courses
  const handleAddMajorCourses = async () => {
    if (!session?.user?.githubId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/flowchart/major-courses/${session.user.githubId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || [];
        
        // Filter out courses already in flowchart
        const existingCodes = new Set(nodes.map(n => n.id));
        const newCourses = courses.filter((c: any) => !existingCodes.has(c.code.replace(' ', '').toLowerCase()));
        
        // Add each course as a node - arrange by category
        const categoryPositions: Record<string, number> = {};
        newCourses.forEach((course: any) => {
          const category = course.category || "Other";
          if (!categoryPositions[category]) {
            categoryPositions[category] = 0;
          }
          
          const categoryIndex = Object.keys(categoryPositions).indexOf(category);
          const positionInCategory = categoryPositions[category];
          
          const node: Node<CourseNodeData> = {
            id: course.code.replace(' ', '').toLowerCase(),
            type: "courseNode",
            position: {
              x: 100 + categoryIndex * 250,
              y: 100 + positionInCategory * 100,
            },
            data: {
              code: course.code,
              name: course.title,
              credits: course.credits || 3,
              status: "not-started",
            },
          };
          addNode(node);
          
          categoryPositions[category]++;
        });
        
        toast.success(`Added ${newCourses.length} major requirement courses`);
        onClose();
      }
    } catch (error) {
      console.error("Error adding major courses:", error);
      toast.error("Failed to add major courses");
    } finally {
      setLoading(false);
    }
  };
  
  // Add single course by code
  const handleAddSingleCourse = async () => {
    if (!courseCode.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/flowchart/add-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_code: courseCode.toUpperCase() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const course = data.course;
        
        // Check if already exists
        const courseId = course.code.replace(' ', '').toLowerCase();
        if (nodes.some(n => n.id === courseId)) {
          toast.error("Course already in flowchart");
          return;
        }
        
        // Add the course
        const node: Node<CourseNodeData> = {
          id: courseId,
          type: "courseNode",
          position: {
            x: 300 + Math.random() * 200,
            y: 200 + Math.random() * 200,
          },
          data: {
            code: course.code,
            name: course.title,
            credits: course.credits || 3,
            status: "not-started",
          },
        };
        addNode(node);
        
        toast.success(`Added ${course.code}`);
        setCourseCode("");
        onClose();
      } else {
        toast.error("Course not found");
      }
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Courses to Flowchart</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="semester">Semester</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="major">Major</TabsTrigger>
            <TabsTrigger value="single">Single</TabsTrigger>
          </TabsList>
          
          <TabsContent value="semester" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add all courses from a specific semester
              </p>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.code} value={sem.code}>
                      {sem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddFromSemester}
                disabled={!selectedSemester || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Semester Courses
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add all courses you've completed
              </p>
              <Button
                onClick={handleAddAllCompleted}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add All Completed Courses
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="major" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add all courses required for your major
              </p>
              <Button
                onClick={handleAddMajorCourses}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Major Requirements
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="single" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add a specific course by code
              </p>
              <Input
                placeholder="Enter course code (e.g., MATH 2423)"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSingleCourse();
                  }
                }}
              />
              <Button
                onClick={handleAddSingleCourse}
                disabled={!courseCode.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Course
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}