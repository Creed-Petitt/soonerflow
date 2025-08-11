import { Node, Edge } from "@xyflow/react";
import { CourseNodeData } from "@/components/prerequisite-flow/course-node";

// Initial nodes - Computer Engineering courses
export const initialNodes: Node<CourseNodeData>[] = [
  // First Year
  {
    id: "math1914",
    type: "courseNode",
    position: { x: 100, y: 50 },
    data: {
      code: "MATH 1914",
      name: "Calculus I",
      credits: 4,
      status: "completed",
      semester: "Fall 2022",
    },
  },
  {
    id: "chem1315",
    type: "courseNode",
    position: { x: 300, y: 50 },
    data: {
      code: "CHEM 1315",
      name: "General Chemistry",
      credits: 3,
      status: "completed",
      semester: "Fall 2022",
    },
  },
  {
    id: "engr1413",
    type: "courseNode",
    position: { x: 500, y: 50 },
    data: {
      code: "ENGR 1413",
      name: "Engineering Thinking",
      credits: 3,
      status: "completed",
      semester: "Fall 2022",
    },
  },
  
  // Second Semester
  {
    id: "math2924",
    type: "courseNode",
    position: { x: 100, y: 200 },
    data: {
      code: "MATH 2924",
      name: "Calculus II",
      credits: 4,
      status: "completed",
      semester: "Spring 2023",
    },
  },
  {
    id: "phys2514",
    type: "courseNode",
    position: { x: 300, y: 200 },
    data: {
      code: "PHYS 2514",
      name: "Physics for Engineers I",
      credits: 4,
      status: "completed",
      semester: "Spring 2023",
    },
  },
  
  // Sophomore Year
  {
    id: "math2934",
    type: "courseNode",
    position: { x: 100, y: 350 },
    data: {
      code: "MATH 2934",
      name: "Calculus III",
      credits: 4,
      status: "completed",
      semester: "Fall 2023",
    },
  },
  {
    id: "phys2524",
    type: "courseNode",
    position: { x: 300, y: 350 },
    data: {
      code: "PHYS 2524",
      name: "Physics for Engineers II",
      credits: 4,
      status: "completed",
      semester: "Fall 2023",
    },
  },
  {
    id: "ece2214",
    type: "courseNode",
    position: { x: 500, y: 350 },
    data: {
      code: "ECE 2214",
      name: "Digital Design",
      credits: 4,
      status: "completed",
      semester: "Fall 2024",
    },
  },
  
  // Spring Sophomore
  {
    id: "math3113",
    type: "courseNode",
    position: { x: 100, y: 500 },
    data: {
      code: "MATH 3113",
      name: "Differential Equations",
      credits: 3,
      status: "in-progress",
      semester: "Spring 2025",
    },
  },
  {
    id: "ece2723",
    type: "courseNode",
    position: { x: 300, y: 500 },
    data: {
      code: "ECE 2723",
      name: "Electrical Circuits I",
      credits: 3,
      status: "in-progress",
      semester: "Spring 2025",
    },
  },
  {
    id: "ece2713",
    type: "courseNode",
    position: { x: 500, y: 500 },
    data: {
      code: "ECE 2713",
      name: "Digital Signals and Filtering",
      credits: 3,
      status: "not-started",
    },
  },
  
  // Junior Year
  {
    id: "ece3723",
    type: "courseNode",
    position: { x: 300, y: 650 },
    data: {
      code: "ECE 3723",
      name: "Electrical Circuits II",
      credits: 3,
      status: "not-started",
    },
  },
  {
    id: "ece3793",
    type: "courseNode",
    position: { x: 500, y: 650 },
    data: {
      code: "ECE 3793",
      name: "Signals and Systems",
      credits: 3,
      status: "not-started",
    },
  },
  {
    id: "ece3613",
    type: "courseNode",
    position: { x: 700, y: 650 },
    data: {
      code: "ECE 3613",
      name: "Electromagnetic Fields I",
      credits: 3,
      status: "not-started",
    },
  },
  
  // Senior Year
  {
    id: "ece4273",
    type: "courseNode",
    position: { x: 500, y: 800 },
    data: {
      code: "ECE 4273",
      name: "Digital Signal Processing",
      credits: 3,
      status: "locked",
    },
  },
  {
    id: "ece4743",
    type: "courseNode",
    position: { x: 300, y: 800 },
    data: {
      code: "ECE 4743",
      name: "Computer Architecture",
      credits: 3,
      status: "locked",
    },
  },
];

// Initial edges - prerequisite relationships
export const initialEdges: Edge[] = [
  // Math sequence
  {
    id: "e-math1914-math2924",
    source: "math1914",
    target: "math2924",
    type: "prerequisite",
    data: { satisfied: true },
  },
  {
    id: "e-math2924-math2934",
    source: "math2924",
    target: "math2934",
    type: "prerequisite",
    data: { satisfied: true },
  },
  {
    id: "e-math2924-math3113",
    source: "math2924",
    target: "math3113",
    type: "prerequisite",
    data: { satisfied: true },
  },
  
  // Physics sequence
  {
    id: "e-math2924-phys2514",
    source: "math2924",
    target: "phys2514",
    type: "prerequisite",
    data: { satisfied: true, corequisite: true },
  },
  {
    id: "e-phys2514-phys2524",
    source: "phys2514",
    target: "phys2524",
    type: "prerequisite",
    data: { satisfied: true },
  },
  
  // ECE sequences
  {
    id: "e-phys2524-ece2723",
    source: "phys2524",
    target: "ece2723",
    type: "prerequisite",
    data: { satisfied: true },
  },
  {
    id: "e-ece2723-ece3723",
    source: "ece2723",
    target: "ece3723",
    type: "prerequisite",
    data: { satisfied: false }, // Not completed yet
  },
  {
    id: "e-ece2713-ece3793",
    source: "ece2713",
    target: "ece3793",
    type: "prerequisite",
    data: { satisfied: false },
  },
  {
    id: "e-math3113-ece3793",
    source: "math3113",
    target: "ece3793",
    type: "prerequisite",
    data: { satisfied: false },
  },
  {
    id: "e-ece3793-ece4273",
    source: "ece3793",
    target: "ece4273",
    type: "prerequisite",
    data: { satisfied: false },
  },
  {
    id: "e-ece3723-ece4743",
    source: "ece3723",
    target: "ece4743",
    type: "prerequisite",
    data: { satisfied: false },
  },
  {
    id: "e-phys2524-ece3613",
    source: "phys2524",
    target: "ece3613",
    type: "prerequisite",
    data: { satisfied: true },
  },
];