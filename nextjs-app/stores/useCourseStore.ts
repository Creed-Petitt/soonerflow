import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { CourseNodeData } from '@/components/prerequisite-flow/course-node';

interface ScheduledCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  section?: string;
  time?: string;
  location?: string;
  instructor?: string;
}

interface CompletedCourse {
  id: string;
  code: string;
  grade: string;
  semester: string;
}

interface CourseStore {
  // State
  scheduledCourses: Map<string, ScheduledCourse>;
  completedCourses: Map<string, CompletedCourse>;
  flowChartNodes: Node<CourseNodeData>[];
  flowChartEdges: Edge[];
  
  // Actions
  addToSchedule: (course: any, semester: string) => void;
  removeFromSchedule: (courseId: string) => void;
  
  addToFlowChart: (course: any) => void;
  removeFromFlowChart: (courseId: string) => void;
  updateFlowChartNodes: (nodes: Node<CourseNodeData>[]) => void;
  updateFlowChartEdges: (edges: Edge[]) => void;
  
  markComplete: (courseId: string, grade: string, semester: string) => void;
  markIncomplete: (courseId: string) => void;
  
  checkPrerequisites: (courseId: string) => boolean;
  getCourseStatus: (courseId: string) => 'completed' | 'in-progress' | 'not-started' | 'locked';
  
  // Batch operations
  markMultipleComplete: (courses: Array<{id: string, course_name?: string, credits?: number, grade: string, semester: string}>, userEmail?: string) => void;
  addMultipleToFlowChart: (courses: any[]) => void;
  
  // Load completed courses from backend
  loadCompletedCourses: (userEmail?: string) => void;
  
  // Export flowchart courses to scheduler
  exportFlowchartToScheduler: () => void;
  
  // Clear flowchart
  clearFlowChart: () => void;
}

const useCourseStore = create<CourseStore>((set, get) => ({
  // Initial state
  scheduledCourses: new Map(),
  completedCourses: new Map(),
  flowChartNodes: [],
  flowChartEdges: [],
  
  // Add course to schedule
  addToSchedule: (course, semester) => {
    console.log('🎯 Zustand addToSchedule called with:', course, 'for semester:', semester);
    set((state) => {
      const newScheduled = new Map(state.scheduledCourses);
      newScheduled.set(course.id, {
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        semester,
        section: course.section,
        time: course.time,
        location: course.location,
        instructor: course.instructor,
      });
      console.log('📚 Updated scheduledCourses:', Array.from(newScheduled.values()));
      return { scheduledCourses: newScheduled };
    });
  },
  
  // Remove course from schedule
  removeFromSchedule: (courseId) => {
    set((state) => {
      const newScheduled = new Map(state.scheduledCourses);
      newScheduled.delete(courseId);
      return { scheduledCourses: newScheduled };
    });
  },
  
  // Add course to flow chart
  addToFlowChart: (course) => {
    set((state) => {
      // Check if course already exists in flow
      if (state.flowChartNodes.some(node => node.id === course.id)) {
        return state;
      }
      
      // Create new node
      const newNode: Node<CourseNodeData> = {
        id: course.id,
        type: 'courseNode',
        position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 },
        data: {
          code: course.code,
          name: course.name,
          credits: course.credits,
          status: get().getCourseStatus(course.id),
        },
      };
      
      // Add prerequisites as well (this would need prerequisite data)
      // For now, just add the single course
      const newNodes = [...state.flowChartNodes, newNode];
      
      return { flowChartNodes: newNodes };
    });
  },
  
  // Remove course from flow chart
  removeFromFlowChart: (courseId) => {
    set((state) => {
      const newNodes = state.flowChartNodes.filter(node => node.id !== courseId);
      const newEdges = state.flowChartEdges.filter(
        edge => edge.source !== courseId && edge.target !== courseId
      );
      return { 
        flowChartNodes: newNodes,
        flowChartEdges: newEdges 
      };
    });
  },
  
  // Update flow chart nodes (for drag and drop)
  updateFlowChartNodes: (nodes) => {
    set({ flowChartNodes: nodes });
  },
  
  // Update flow chart edges
  updateFlowChartEdges: (edges) => {
    set({ flowChartEdges: edges });
  },
  
  // Mark course as complete
  markComplete: (courseId, grade, semester) => {
    set((state) => {
      const newCompleted = new Map(state.completedCourses);
      const scheduled = state.scheduledCourses.get(courseId);
      
      newCompleted.set(courseId, {
        id: courseId,
        code: scheduled?.code || courseId,
        grade,
        semester,
      });
      
      // Update flow chart node status if it exists
      const newNodes = state.flowChartNodes.map(node => {
        if (node.id === courseId) {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'completed' as const,
            },
          };
        }
        return node;
      });
      
      // Remove from scheduled if it was there
      const newScheduled = new Map(state.scheduledCourses);
      newScheduled.delete(courseId);
      
      return { 
        completedCourses: newCompleted,
        scheduledCourses: newScheduled,
        flowChartNodes: newNodes,
      };
    });
  },
  
  // Mark course as incomplete
  markIncomplete: (courseId) => {
    set((state) => {
      const newCompleted = new Map(state.completedCourses);
      newCompleted.delete(courseId);
      
      // Update flow chart node status
      const newNodes = state.flowChartNodes.map(node => {
        if (node.id === courseId) {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'not-started' as const,
            },
          };
        }
        return node;
      });
      
      return { 
        completedCourses: newCompleted,
        flowChartNodes: newNodes,
      };
    });
  },
  
  // Check if prerequisites are met (simplified for now)
  checkPrerequisites: (courseId) => {
    // This would need to check actual prerequisite data
    // For now, return true
    return true;
  },
  
  // Get course status
  getCourseStatus: (courseId) => {
    const completed = get().completedCourses.has(courseId);
    const scheduled = get().scheduledCourses.has(courseId);
    
    if (completed) return 'completed';
    if (scheduled) return 'in-progress';
    
    // Check prerequisites to determine if locked
    const prereqsMet = get().checkPrerequisites(courseId);
    return prereqsMet ? 'not-started' : 'locked';
  },
  
  // Batch mark complete
  markMultipleComplete: (courses, userEmail) => {
    // Save to backend first (using async IIFE) - but don't block the UI
    if (typeof window !== 'undefined' && userEmail) {
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/user/courses/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userEmail, // Use provided email
              courses: courses.map(c => ({
                course_code: c.id,
                course_name: c.course_name || c.id,
                credits: c.credits || 3,
                grade: c.grade,
                semester: c.semester
              }))
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to save completed courses to backend');
          } else {
            // Dispatch event to refresh dashboard
            window.dispatchEvent(new CustomEvent('coursesCompleted'));
            console.log('✅ Saved courses to backend and dispatched refresh event');
          }
        } catch (error) {
          console.error('Error saving completed courses:', error);
          // Still update UI even if backend fails
        }
      }, 100);
    }
    
    // Update local state
    set((state) => {
      const newCompleted = new Map(state.completedCourses);
      const newScheduled = new Map(state.scheduledCourses);
      
      courses.forEach(({ id, grade, semester }) => {
        const scheduled = state.scheduledCourses.get(id);
        newCompleted.set(id, {
          id,
          code: scheduled?.code || id,
          grade,
          semester,
        });
        newScheduled.delete(id);
      });
      
      // Update flow chart nodes
      const newNodes = state.flowChartNodes.map(node => {
        if (courses.some(c => c.id === node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'completed' as const,
            },
          };
        }
        return node;
      });
      
      return { 
        completedCourses: newCompleted,
        scheduledCourses: newScheduled,
        flowChartNodes: newNodes,
      };
    });
  },
  
  // Add multiple courses to flow chart
  addMultipleToFlowChart: (courses) => {
    courses.forEach(course => {
      get().addToFlowChart(course);
    });
  },
  
  // Load completed courses from backend with deduplication
  loadCompletedCourses: (() => {
    let isLoading = false;
    let currentUserEmail: string | null = null;
    
    return (userEmail?: string) => {
      // Only run on client-side with email
      if (typeof window === 'undefined' || !userEmail) return;
      
      // Prevent multiple simultaneous calls for the same user
      if (isLoading && currentUserEmail === userEmail) return;
      
      isLoading = true;
      currentUserEmail = userEmail;
      
      // Load immediately, no delay
      (async () => {
        try {
          const response = await fetch(`/api/user/courses/completed?user_email=${encodeURIComponent(userEmail)}`);
          if (response.ok) {
            const data = await response.json();
            const completedCoursesMap = new Map();
            
            console.log('🎓 Loaded completed courses for', userEmail, ':', data.completedCourses);
            
            data.completedCourses.forEach((course: any) => {
              completedCoursesMap.set(course.course_code, {
                id: course.course_code,
                code: course.course_code,
                grade: course.grade,
                semester: course.semester
              });
            });
            
            set((state) => ({
              ...state,
              completedCourses: completedCoursesMap
            }));
          }
        } catch (error) {
          console.error('Error loading completed courses:', error);
        } finally {
          isLoading = false;
          currentUserEmail = null;
        }
      })();
    };
  })(),
  
  // Export flowchart courses to scheduler
  exportFlowchartToScheduler: () => {
    set((state) => {
      const newScheduled = new Map(state.scheduledCourses);
      
      // Add each flowchart node to scheduled courses with default semester
      state.flowChartNodes.forEach((node) => {
        if (!state.scheduledCourses.has(node.id) && !state.completedCourses.has(node.id)) {
          newScheduled.set(node.id, {
            id: node.id,
            code: node.data.code,
            name: node.data.name || node.data.code,
            credits: node.data.credits || 3,
            semester: 'Spring 2025', // Default semester, can be changed later
          });
        }
      });
      
      return { scheduledCourses: newScheduled };
    });
  },
  
  // Clear all flowchart nodes and edges
  clearFlowChart: () => {
    set({ flowChartNodes: [], flowChartEdges: [] });
  },
}));

export default useCourseStore;